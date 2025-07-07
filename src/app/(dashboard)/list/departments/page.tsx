"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell, TableHeader, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { DepartmentForm } from "@/components/forms/DepartmentForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import React from "react";
import { Plus, Eye, Pencil, Trash2, Download, Printer, Loader2, ArrowUpDown, MoreHorizontal, RefreshCw, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ViewDialog } from '@/components/ViewDialog';
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { FilterDialog } from '@/components/FilterDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { SortDialog, SortFieldOption } from '@/components/SortDialog';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { PrintLayout } from '@/components/PrintLayout';
import { TableCardView } from '@/components/TableCardView';
import { TableRowActions } from '@/components/TableRowActions';
import { TableList, TableListColumn } from '@/components/TableList';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableExpandedRow } from '@/components/TableExpandedRow';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import AttendanceHeader from '../../../../components/AttendanceHeader';
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from '@/hooks/use-debounce';


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
  logo?: string;
  settings: {
    autoGenerateCode: boolean;
    allowCourseOverlap: boolean;
    maxInstructors: number;
  };
}
type SortFieldKey = 'name' | 'code' | 'totalInstructors' | 'totalCourses' | 'status' | 'head';
type SortOrder = 'asc' | 'desc';
const ITEMS_PER_PAGE = 10;

type MultiSortField = { field: SortFieldKey; order: SortOrder };
const sortFieldOptions: { value: SortFieldKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'totalInstructors', label: 'Total Instructors' },
  { value: 'totalCourses', label: 'Total Courses' },
  { value: 'status', label: 'Status' },
];

const departmentSortFieldOptions: SortFieldOption<string>[] = [
  { value: 'name', label: 'Department Name' },
  { value: 'code', label: 'Department Code' },
  { value: 'head', label: 'Head of Department' },
  { value: 'totalCourses', label: 'Total Courses' },
  { value: 'totalInstructors', label: 'Total Instructors' },
  { value: 'status', label: 'Status' },
];

// Helper for highlighting
function highlightMatch(text: string, matches: readonly [number, number][] | undefined) {
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
}

// Define column configuration once
const DEPARTMENT_COLUMNS: TableListColumn<Department>[] = [
  { header: "Department Name", accessor: "name", className: "text-blue-900 align-middle", sortable: true },
  { header: "Code", accessor: "code", className: "text-blue-900 align-middle", sortable: true },
  { header: "Head of Department", accessor: "headOfDepartment", className: "text-blue-900 text-center align-middle", sortable: true },
  { header: "Description", accessor: "description", className: "text-blue-900 text-center align-middle" },
  { 
    header: "Total Courses", 
    accessor: "totalCourses", 
    className: "text-blue-900 text-center align-middle", 
    render: (item: Department) => item.courseOfferings?.length || 0,
    sortable: true
  },
  { header: "Total Instructors", accessor: "totalInstructors", className: "text-blue-900 text-center align-middle", sortable: true },
  { 
    header: "Status", 
    accessor: "status", 
    className: "text-center align-middle", 
    render: (item: Department) => (
      <Badge variant={item.status === "active" ? "success" : "destructive"} className="text-xs px-3 py-1 rounded-full">
        {item.status.toUpperCase()}
      </Badge>
    ),
    sortable: true
  },
];

// Add API response types
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface DepartmentResponse extends Department {
  courseOfferings: Course[];
  totalInstructors: number;
}

// Add interfaces for better type safety
interface PageState {
  loading: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  isExporting: boolean;
  isPrinting: boolean;
  isFiltering: boolean;
  error: string | null;
  operationInProgress: {
    type: 'fetch' | 'refresh' | 'delete' | 'export' | 'print' | null;
    retryCount: number;
  };
}

interface FilterState {
  name: string;
  code: string;
  head: string;
  minCourses: string;
  maxCourses: string;
  minInstructors: string;
  maxInstructors: string;
  status: string;
}

interface SortState {
  field: SortFieldKey;
  order: SortOrder;
  fields: MultiSortField[];
}

interface DialogState {
  modalOpen: boolean;
  deleteDialogOpen: boolean;
  filterDialogOpen: boolean;
  sortDialogOpen: boolean;
  exportDialogOpen: boolean;
  viewDialogOpen: boolean;
  departmentToDelete: {
    id: string;
    name: string;
  } | null;
}

interface EditableCell {
  rowId: string;
  columnAccessor: string;
}

// Add validation utilities
const validateDepartment = (dept: any): dept is DepartmentResponse => {
  return (
    typeof dept === 'object' &&
    dept !== null &&
    typeof dept.id === 'string' &&
    typeof dept.name === 'string' &&
    typeof dept.code === 'string' &&
    typeof dept.headOfDepartment === 'string' &&
    Array.isArray(dept.courseOfferings) &&
    typeof dept.totalInstructors === 'number' &&
    (dept.status === 'active' || dept.status === 'inactive')
  );
};

const validateDepartments = (data: any[]): data is DepartmentResponse[] => {
  return Array.isArray(data) && data.every(validateDepartment);
};

// Add retry utility
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T,>(
  operation: () => Promise<T>,
  retryCount: number = 0
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return retryOperation(operation, retryCount + 1);
    }
    throw error;
  }
};

// Add user-friendly error messages
const getErrorMessage = (error: unknown, operation: string): string => {
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return `Unable to ${operation}. Please check your internet connection and try again.`;
    }
    if (error.message.includes('not found')) {
      return `The requested department could not be found.`;
    }
    if (error.message.includes('permission')) {
      return `You don't have permission to ${operation}. Please contact your administrator.`;
    }
    return `An error occurred while trying to ${operation}: ${error.message}`;
  }
  return `An unexpected error occurred while trying to ${operation}. Please try again later.`;
};

// Define FilterField type to match FilterDialog
type FilterField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  badgeType?: 'active' | 'range';
  minKey?: string;
  maxKey?: string;
  options?: { value: string; label: string }[];
};

// Add helper to get active filter chips
const getActiveFilterChips = (filters: FilterState) => {
  const chips = [];
  if (filters.status && filters.status !== 'all') chips.push({ key: 'status', label: `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}` });
  if (filters.head) chips.push({ key: 'head', label: `Head: ${filters.head}` });
  if (filters.minCourses) chips.push({ key: 'minCourses', label: `Min Courses: ${filters.minCourses}` });
  if (filters.maxCourses) chips.push({ key: 'maxCourses', label: `Max Courses: ${filters.maxCourses}` });
  if (filters.minInstructors) chips.push({ key: 'minInstructors', label: `Min Instructors: ${filters.minInstructors}` });
  if (filters.maxInstructors) chips.push({ key: 'maxInstructors', label: `Max Instructors: ${filters.maxInstructors}` });
  if (filters.name) chips.push({ key: 'name', label: `Name: ${filters.name}` });
  if (filters.code) chips.push({ key: 'code', label: `Code: ${filters.code}` });
  return chips;
};

export default function DepartmentListPage() {
  // State declarations with proper types
  const [pageState, setPageState] = useState<PageState>({
    loading: true,
    isRefreshing: false,
    isDeleting: false,
    isExporting: false,
    isPrinting: false,
    isFiltering: false,
    error: null,
    operationInProgress: {
      type: null,
      retryCount: 0
    }
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    name: '',
    code: '',
    head: '',
    minCourses: '',
    maxCourses: '',
    minInstructors: '',
    maxInstructors: '',
    status: 'all'
  });

  const [sortState, setSortState] = useState<SortState>({
    field: 'name',
    order: 'asc',
    fields: [{ field: 'name', order: 'asc' }]
  });

  const [dialogState, setDialogState] = useState<DialogState>({
    modalOpen: false,
    deleteDialogOpen: false,
    filterDialogOpen: false,
    sortDialogOpen: false,
    exportDialogOpen: false,
    viewDialogOpen: false,
    departmentToDelete: null
  });

  // Other state variables
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [modalDepartment, setModalDepartment] = useState<Department | undefined>();
  const [viewDepartment, setViewDepartment] = useState<Department | undefined>();
  const [search, setSearch] = useState<string>("");
  const [instructors, setInstructors] = useState<any[]>([]);
  const router = useRouter();

  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEPARTMENT_COLUMNS.map(c => c.accessor));
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);

  const fuse = React.useMemo(() => new Fuse(departments, {
    keys: ["name", "code"],
    threshold: 0.4,
    includeMatches: true,
  }), [departments]);

  const debouncedSearch = useDebounce(search, 300);

  const fuzzyResults = React.useMemo(() => {
    if (!debouncedSearch) return departments.map((d, i) => ({ item: d, refIndex: i }));
    return fuse.search(debouncedSearch);
  }, [debouncedSearch, fuse]);

  const filteredDepartments = useMemo(() => {
    let result = fuzzyResults.map(r => r.item);
    if (filters.status !== 'all') {
      result = result.filter((dept) => dept.status === filters.status);
    }
    // Advanced filters
    if (filters.head) {
      result = result.filter(dept => dept.headOfDepartment?.toLowerCase().includes(filters.head.toLowerCase()));
    }
    if (filters.minCourses) {
      result = result.filter(dept => (dept.courseOfferings?.length || 0) >= Number(filters.minCourses));
    }
    if (filters.maxCourses) {
      result = result.filter(dept => (dept.courseOfferings?.length || 0) <= Number(filters.maxCourses));
    }
    if (filters.minInstructors) {
      result = result.filter(dept => (dept.totalInstructors || 0) >= Number(filters.minInstructors));
    }
    if (filters.maxInstructors) {
      result = result.filter(dept => (dept.totalInstructors || 0) <= Number(filters.maxInstructors));
    }
    if (filters.name) {
      result = result.filter(dept => dept.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.code) {
      result = result.filter(dept => dept.code.toLowerCase().includes(filters.code.toLowerCase()));
    }
    // Multi-column sort
    result.sort((a, b) => {
      for (const { field, order } of sortState.fields) {
      let aValue: string | number;
      let bValue: string | number;
        if (field === 'totalCourses') {
        aValue = a.courseOfferings?.length || 0;
        bValue = b.courseOfferings?.length || 0;
      } else {
          aValue = a[field as keyof Department] as string | number;
          bValue = b[field as keyof Department] as string | number;
      }
        const modifier = order === 'asc' ? 1 : -1;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
          const cmp = aValue.localeCompare(bValue);
          if (cmp !== 0) return cmp * modifier;
        } else {
          const cmp = (aValue as number) - (bValue as number);
          if (cmp !== 0) return cmp * modifier;
        }
      }
      return 0;
    });
    return result;
  }, [fuzzyResults, filters, sortState.fields]);

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
  const columns: TableListColumn<Department>[] = [
    {
      header: '',
      accessor: 'expander',
      className: 'w-12 text-center',
      expandedContent: (item: Department) => (
        <TableExpandedRow
          colSpan={columns.length + 1}
          title="Courses Offered"
          headers={["Course Name", "Code", "Status", "Students"]}
          rows={item.courseOfferings}
          renderRow={course => (
            <TableRow key={course.id} className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer">
              <TableCell>{course.name}</TableCell>
              <TableCell>{course.code}</TableCell>
              <TableCell>
                <Badge variant={course.status === 'active' ? 'success' : 'destructive'}>
                  {course.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{course.totalStudents}</TableCell>
            </TableRow>
          )}
          emptyMessage="No courses offered by this department."
        />
      ),
    },
    {
      header: (
        <div className="flex justify-center items-center">
          <SharedCheckbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll} />
        </div>
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    ...DEPARTMENT_COLUMNS.filter(col => visibleColumns.includes(col.accessor)),
    { 
      header: "Actions", 
      accessor: "actions", 
      className: "text-center align-middle", 
      render: (item: Department) => (
        <TableRowActions
          onView={() => { setViewDepartment(item); setDialogState(prev => ({ ...prev, viewDialogOpen: true })); }}
          onEdit={() => { setModalDepartment(item); setDialogState(prev => ({ ...prev, modalOpen: true })); }}
          onDelete={() => { handleDelete(item); }}
          itemName={item.name}
          disabled={item.status === "active" || item.courseOfferings?.length > 0 || item.totalInstructors > 0}
          deleteTooltip={getDeleteTooltip(item)}
          viewAriaLabel="View Department"
        />
      )
    },
  ];

  // Update exportableColumns to use the shared configuration
  const exportableColumns = DEPARTMENT_COLUMNS.map(col => ({
    key: col.accessor,
    label: typeof col.header === 'string' ? col.header : col.accessor
  }));

  // Update printColumns to use the shared configuration
  const printColumns = DEPARTMENT_COLUMNS.map(col => ({
    header: typeof col.header === 'string' ? col.header : col.accessor,
    accessor: col.accessor
  }));

  // Add export columns state
  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map(col => col.key));

  // Add state for removing chip
  const [removingChip, setRemovingChip] = useState<string | null>(null);

  // Export handlers
  const handleExport = async () => {
    if (!exportFormat) {
      toast.error("Please select an export format");
      return;
    }

    try {
      setPageState(prev => ({ 
        ...prev, 
        isExporting: true, 
        error: null,
        operationInProgress: { type: 'export', retryCount: 0 }
      }));

      const selectedColumns = exportableColumns.filter(col => exportColumns.includes(col.key));
      const headers = selectedColumns.map(col => col.label);
      const rows = filteredDepartments.map((dept) =>
        selectedColumns.map((col) => {
          if (col.key === 'totalCourses') return String(dept.courseOfferings?.length || 0);
          if (col.key === 'totalInstructors') return String(dept.totalInstructors || 0);
          return String(dept[col.key as keyof Department] || '');
        })
      );

      switch (exportFormat) {
        case 'pdf':
          const doc = new jsPDF();
          // Add title
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(12, 37, 86); // Dark blue color
          doc.text('Department List', doc.internal.pageSize.width / 2, 20, { align: 'center' });
          
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

          // Reset text color for table
          doc.setTextColor(0, 0, 0);

          // Add some spacing
          doc.setFontSize(12);
          autoTable(doc, {
            head: [headers] as string[][],
            body: rows as string[][],
            startY: 35,
            styles: { 
              fontSize: 8,
              cellPadding: 3,
              overflow: 'linebreak',
              cellWidth: 'wrap',
            },
            headStyles: { 
              fillColor: [12, 37, 86],
              textColor: [255, 255, 255],
              halign: 'center',
              fontStyle: 'bold',
            },
            columnStyles: {
              0: { cellWidth: 'auto' }, // Department Name
              1: { cellWidth: 'auto' }, // Code
              2: { cellWidth: 'auto' }, // Head of Department
              3: { cellWidth: 'auto' }, // Description
              4: { cellWidth: 'auto', halign: 'center' }, // Total Courses
              5: { cellWidth: 'auto', halign: 'center' }, // Total Instructors
              6: { cellWidth: 'auto', halign: 'center' }, // Status
            },
            margin: { top: 16, right: 10, bottom: 10, left: 10 },
            theme: 'grid',
          });
          doc.save("departments.pdf");
          break;

        case 'excel':
          const wsData = [headers, ...rows] as string[][];
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          
          // Set column widths based on content
          const colWidths = headers.map((_, index) => {
            const maxLength = Math.max(
              ...wsData.map(row => (row[index] || '').toString().length),
              headers[index].length
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
              
              // Apply styling to data cells
              ws[cellRef].s = {
                alignment: { horizontal: 'center', vertical: 'center' }
              };
            }
          }

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Departments");
          XLSX.writeFile(wb, "departments.xlsx");
          break;

        case 'csv':
          const csvRows = [headers, ...rows] as string[][];
    const csvContent = csvRows.map((row) => row.map(String).map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'departments.csv';
    a.click();
    URL.revokeObjectURL(url);
          break;
      }

      toast.success(`Successfully exported departments to ${exportFormat.toUpperCase()}`);
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'export departments');
      setPageState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isExporting: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
      toast.error(errorMessage);
    } finally {
      setPageState(prev => ({ 
        ...prev, 
        isExporting: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
    }
  };

  // Print handler using PrintLayout
  const handlePrint = () => {
    const printData = filteredDepartments.map((d) => ({
      ...d,
      totalCourses: d.courseOfferings?.length?.toString() || '0',
      totalInstructors: d.totalInstructors?.toString() || '0',
    }));
    const printFunction = PrintLayout({
      title: 'Department List',
      data: printData,
      columns: printColumns,
      totalItems: filteredDepartments.length,
    });
    printFunction();
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected department(s)? This action cannot be undone.`)) return;
    setPageState(prev => ({ ...prev, loading: true }));
    try {
      // Simulate API call
      await new Promise(res => setTimeout(res, 1000));
      setDepartments(prev => prev.filter(d => !selectedIds.includes(d.id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} department(s) deleted successfully.`);
    } catch (err) {
      toast.error("Failed to delete departments.");
    }
    setPageState(prev => ({ ...prev, loading: false }));
  };

  // Add handleSort function
  const handleSort = (field: string) => {
    setSortState(prev => {
      if (prev.field === field) {
        return { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' };
      }
      return { ...prev, field: field as SortFieldKey, order: 'asc' };
    });
  };

  // Fetch departments from API with proper error handling, retry logic, and validation
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setPageState(prev => ({ 
          ...prev, 
          loading: true, 
          error: null,
          operationInProgress: { type: 'fetch', retryCount: 0 }
        }));

        const response = await retryOperation(async () => {
          const res = await fetch('/api/departments');
          if (!res.ok) {
            throw new Error(`Failed to fetch departments: ${res.statusText}`);
          }
          return res;
        });

        const data: ApiResponse<DepartmentResponse[]> = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.data || !validateDepartments(data.data)) {
          throw new Error('Invalid department data received from server');
        }

        setDepartments(data.data);
        setPageState(prev => ({ 
          ...prev, 
          loading: false,
          operationInProgress: { type: null, retryCount: 0 }
        }));
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'load departments');
        setPageState(prev => ({ 
          ...prev, 
          error: errorMessage,
          loading: false,
          operationInProgress: { type: null, retryCount: 0 }
        }));
        toast.error(errorMessage);
      }
    };

    fetchDepartments();
  }, []);

  // Reset pagination on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortState.fields, filters]);

  // Add refresh function with proper error handling, retry logic, and validation
  const refreshDepartments = async () => {
    try {
      setPageState(prev => ({ 
        ...prev, 
        isRefreshing: true, 
        error: null,
        operationInProgress: { type: 'refresh', retryCount: 0 }
      }));

      const response = await retryOperation(async () => {
        const res = await fetch('/api/departments');
        if (!res.ok) {
          throw new Error(`Failed to refresh departments: ${res.statusText}`);
        }
        return res;
      });

      const data: ApiResponse<DepartmentResponse[]> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.data || !validateDepartments(data.data)) {
        throw new Error('Invalid department data received from server');
      }

      setDepartments(data.data);
      toast.success('Departments refreshed successfully');
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'refresh departments');
      setPageState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isRefreshing: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
      toast.error(errorMessage);
    } finally {
      setPageState(prev => ({ 
        ...prev, 
        isRefreshing: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
    }
  };

  // Helper function for delete tooltip
  const getDeleteTooltip = (item: Department) => {
    if (item.status === "active") return "Cannot delete an active department";
    if (item.courseOfferings?.length > 0) return "Cannot delete department with courses";
    if (item.totalInstructors > 0) return "Cannot delete department with instructors";
    return undefined;
  };

  // Update filter dialog to use consolidated state
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev: FilterState) => ({ ...prev, ...newFilters }));
  };

  // Update filter reset
  const handleFilterReset = () => {
    setFilters({
      name: '',
      code: '',
      head: '',
      minCourses: '',
      maxCourses: '',
      minInstructors: '',
      maxInstructors: '',
      status: 'all'
    });
  };

  // State setters with proper types
  const setLoading = (loading: boolean) => setPageState((prev: PageState) => ({ ...prev, loading }));
  const setError = (error: string | null) => setPageState((prev: PageState) => ({ ...prev, error }));
  const setRefreshing = (isRefreshing: boolean) => setPageState((prev: PageState) => ({ ...prev, isRefreshing }));
  const setDeleting = (isDeleting: boolean) => setPageState((prev: PageState) => ({ ...prev, isDeleting }));
  const setExporting = (isExporting: boolean) => setPageState((prev: PageState) => ({ ...prev, isExporting }));
  const setPrinting = (isPrinting: boolean) => setPageState((prev: PageState) => ({ ...prev, isPrinting }));
  const setFiltering = (isFiltering: boolean) => setPageState((prev: PageState) => ({ ...prev, isFiltering }));

  // Dialog state setters
  const setModalOpen = (open: boolean) => setDialogState((prev: DialogState) => ({ ...prev, modalOpen: open }));
  const setDeleteDialogOpen = (open: boolean) => setDialogState((prev: DialogState) => ({ ...prev, deleteDialogOpen: open }));
  const setFilterDialogOpen = (open: boolean) => setDialogState((prev: DialogState) => ({ ...prev, filterDialogOpen: open }));
  const setSortDialogOpen = (open: boolean) => setDialogState((prev: DialogState) => ({ ...prev, sortDialogOpen: open }));
  const setExportDialogOpen = (open: boolean) => setDialogState((prev: DialogState) => ({ ...prev, exportDialogOpen: open }));
  const setViewDialogOpen = (open: boolean) => setDialogState((prev: DialogState) => ({ ...prev, viewDialogOpen: open }));

  // Sort state setters
  const setSortField = (field: SortFieldKey) => setSortState((prev: SortState) => ({ ...prev, field }));
  const setSortOrder = (order: SortOrder) => setSortState((prev: SortState) => ({ ...prev, order }));
  const setSortFields = (fields: MultiSortField[]) => setSortState((prev: SortState) => ({ ...prev, fields }));

  // Update handleDelete to use dialogState
  const handleDelete = (department: Department) => {
    setDialogState(prev => ({
      ...prev,
      deleteDialogOpen: true,
      departmentToDelete: {
        id: department.id,
        name: department.name
      }
    }));
  };

  // Update confirmDelete to use dialogState
  const confirmDelete = async () => {
    const departmentToDelete = dialogState.departmentToDelete;
    if (!departmentToDelete) {
      toast.error('No department selected for deletion');
      return;
    }

    try {
      setPageState(prev => ({ 
        ...prev, 
        isDeleting: true, 
        error: null,
        operationInProgress: { type: 'delete', retryCount: 0 }
      }));

      const response = await retryOperation(async () => {
        const res = await fetch(`/api/departments/${departmentToDelete.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error(`Failed to delete department: ${res.statusText}`);
        }
        return res;
      });

      const data: ApiResponse<{ success: boolean }> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setDepartments(prev => prev.filter(d => d.id !== departmentToDelete.id));
      toast.success('Department deleted successfully');
      setDialogState(prev => ({ 
        ...prev, 
        deleteDialogOpen: false,
        departmentToDelete: null 
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'delete department');
      setPageState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isDeleting: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
      toast.error(errorMessage);
    } finally {
      setPageState(prev => ({ 
        ...prev, 
        isDeleting: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
    }
  };

  // Add handler functions for view and edit
  const handleView = (department: Department) => {
    setViewDepartment(department);
    setDialogState(prev => ({ ...prev, viewDialogOpen: true }));
  };

  const handleEdit = (department: Department) => {
    setModalDepartment(department);
    setDialogState(prev => ({ ...prev, modalOpen: true }));
  };

  // Minimal filterFields definition for FilterDialog
  const filterFields: FilterField[] = [
    { key: 'name', label: 'Department Name', type: 'text', badgeType: 'active' },
    { key: 'code', label: 'Department Code', type: 'text', badgeType: 'active' },
    { key: 'head', label: 'Head of Department', type: 'text', badgeType: 'active' },
    { key: 'minCourses', label: 'Total Courses', type: 'number', badgeType: 'range', minKey: 'minCourses', maxKey: 'maxCourses' },
    { key: 'minInstructors', label: 'Total Instructors', type: 'number', badgeType: 'range', minKey: 'minInstructors', maxKey: 'maxInstructors' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <AttendanceHeader
        title="Departments"
        subtitle="Manage academic departments and their details"
        currentSection="Departments"
      />
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Departments</h1>
            <p className="text-blue-700/80">Manage and view all department information</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => { setModalDepartment(undefined); setDialogState(prev => ({ ...prev, modalOpen: true })); }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              aria-label="Add Department"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 border-blue-200 hover:bg-blue-50">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-56 ">
                <DropdownMenuLabel className="font-semibold px-2 py-1.5 text-blue-900">Page Actions</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2" onClick={() => toast.info('Import functionality is not yet available.')}>
                  <Upload className="h-4 w-4 mr-2" strokeWidth={3} />
                  <span>Import Departments</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2" onClick={() => setExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" strokeWidth={3} />
                  <span>Export Departments</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" strokeWidth={3} />
                  <span>Print Page</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Sticky Filter/Search Bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-border shadow-sm rounded-md mb-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start p-6">
          {/* Search Section */}
          <div className="w-full md:w-1/3">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Search</h3>
            <label htmlFor="search-departments" className="sr-only">Search Departments</label>
            <Input
              id="search-departments"
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-11 px-4 rounded-md border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 w-full"
              aria-label="Search Departments"
            />
          </div>
          <div className="hidden md:block border-l border-blue-200 self-stretch"></div>
          {/* Filter Section */}
          <div className="w-full md:w-2/3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Filter by</h3>
              {Object.values(filters).some(v => v !== '' && v !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={handleFilterReset}
                  className="text-blue-600 hover:bg-blue-50 text-sm h-auto py-1 px-2"
                  aria-label="Clear filters"
                >
                  Clear filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status */}
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-blue-900 mb-2">Status</label>
                <Select value={filters.status} onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="h-11 rounded-md border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary" aria-label="Status Filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2" value="all" aria-label="All statuses">All statuses</SelectItem>
                    <SelectItem className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2" value="active" aria-label="Active statuses">Active</SelectItem>
                    <SelectItem className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2" value="inactive" aria-label="Inactive statuses">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Head of Department */}
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-blue-900 mb-2">Head of Department</label>
                <Input
                  type="text"
                  placeholder="Filter by head..."
                  value={filters.head}
                  onChange={e => setFilters(prev => ({ ...prev, head: e.target.value }))}
                  className="h-11 px-4 rounded-md border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 w-full"
                />
              </div>
              {/* Advanced Filters Button */}
              <div className="sm:col-span-1 flex items-end">
                <Button
                  onClick={() => setFilterDialogOpen(true)}
                  className="w-full h-11 border border-border text-primary bg-light hover:bg-primary hover:text-white transition-colors duration-200 rounded-md"
                  aria-label="Advanced Filters"
                >
                  Advanced Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Filter Chips */}
        {getActiveFilterChips(filters).length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pb-4">
            {getActiveFilterChips(filters).map(chip => (
              <span
                key={chip.key}
                className={`inline-flex items-center bg-blue-100 text-blue-900 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${removingChip === chip.key ? 'opacity-0 translate-y-2' : ''}`}
                style={{ transitionProperty: 'opacity, transform' }}
              >
                {chip.label}
                <button
                  className="ml-2 text-blue-700 hover:text-blue-900 focus:outline-none"
                  onClick={() => {
                    setRemovingChip(chip.key);
                    setTimeout(() => {
                      setFilters((prev: FilterState) => ({ ...prev, [chip.key]: '' }));
                      setRemovingChip(null);
                    }, 200);
                  }}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 ml-2" onClick={handleFilterReset} aria-label="Clear All Filters">
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-blue-200 shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-blue-900">Department List</h2>
              {filteredDepartments.length > 0 && (
                <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                  {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Column Visibility */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 font-medium">Columns:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-blue-200 text-blue-900 h-9 px-3 font-normal">
                      <span className="font-semibold mr-1">{visibleColumns.length}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {DEPARTMENT_COLUMNS.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.accessor}
                        checked={visibleColumns.includes(column.accessor)}
                        onCheckedChange={(checked) => {
                          setVisibleColumns((prev) =>
                            checked
                              ? [...prev, column.accessor]
                              : prev.filter((id) => id !== column.accessor)
                          );
                        }}
                        className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2"
                      >
                        {typeof column.header === 'string' ? column.header : column.accessor}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Show:</span>
                <Select value={String(itemsPerPage)} onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20 h-9 border-blue-200 text-blue-900">
                    <SelectValue placeholder={String(itemsPerPage)} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50].map(size => (
                      <SelectItem key={size} value={String(size)} className="text-blue-900 focus:bg-blue-50 focus:text-blue-900 py-2">{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 border-blue-200" onClick={refreshDepartments} disabled={pageState.isRefreshing}>
                      <span className="sr-only">Refresh data</span>
                      {pageState.isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="relative">
          {/* Loading Skeleton */}
          {(pageState.loading || pageState.isRefreshing) ? (
            <div className="p-8">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-8 w-full mb-4" />
            </div>
          ) : (
            <>
              {/* Table layout for xl+ only */}
              <div className="hidden xl:block">
                <TableList
                  columns={columns}
                  data={paginatedDepartments}
                  loading={pageState.loading}
                  selectedIds={selectedIds}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAll}
                  isAllSelected={isAllSelected}
                  isIndeterminate={isIndeterminate}
                  getItemId={(item) => item.id}
                  expandedRowIds={expandedRowIds}
                  onToggleExpand={(itemId) => {
                    setExpandedRowIds(current => 
                      current.includes(itemId) 
                        ? current.filter(id => id !== itemId)
                        : [...current, itemId]
                    );
                  }}
                  editingCell={editingCell}
                  onCellClick={(item, columnAccessor) => {
                    if (['name', 'code', 'headOfDepartment'].includes(columnAccessor)) {
                      setEditingCell({ rowId: item.id, columnAccessor });
                    }
                  }}
                  onCellChange={async (rowId, columnAccessor, value) => {
                    setEditingCell(null);
                    const originalDepartments = [...departments];
                    const updatedDepartments = departments.map(d =>
                      d.id === rowId ? { ...d, [columnAccessor]: value } : d
                    );
                    setDepartments(updatedDepartments);

                    try {
                      const response = await fetch(`/api/departments/${rowId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ [columnAccessor]: value }),
                      });
                      if (!response.ok) {
                        throw new Error('Failed to update department');
                      }
                      toast.success('Department updated successfully');
                    } catch (error) {
                      setDepartments(originalDepartments);
                      toast.error(getErrorMessage(error, 'update department'));
                    }
                  }}
                  sortState={sortState}
                  onSort={handleSort}
                />
              </div>
              {/* Card layout for small screens */}
              <div className="block xl:hidden p-4">
                <TableCardView
                  items={paginatedDepartments}
                  selectedIds={selectedIds}
                  onSelect={handleSelectRow}
                  onView={(item) => {
                    setViewDepartment(item);
                    setDialogState(prev => ({ ...prev, viewDialogOpen: true }));
                  }}
                  onEdit={(item) => {
                    setModalDepartment(item);
                    setDialogState(prev => ({ ...prev, modalOpen: true }));
                  }}
                  onDelete={(item) => {
                    handleDelete(item);
                  }}
                  getItemId={(item) => item.id}
                  getItemName={(item) => item.name}
                  getItemCode={(item) => item.code}
                  getItemStatus={(item) => item.status}
                  getItemDescription={(item) => item.description}
                  getItemDetails={(item) => [
                    { label: 'Head', value: item.headOfDepartment || 'Not Assigned' },
                    { label: 'Courses', value: item.courseOfferings?.length || 0 },
                    { label: 'Instructors', value: item.totalInstructors || 0 },
                  ]}
                  disabled={(item) => item.status === "active" || item.courseOfferings?.length > 0 || item.totalInstructors > 0}
                  deleteTooltip={(item) => item.status === "active" ? "Cannot delete an active department" : 
                    item.courseOfferings?.length > 0 ? "Cannot delete department with courses" :
                    item.totalInstructors > 0 ? "Cannot delete department with instructors" : undefined}
                  isLoading={pageState.loading}
                />
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-blue-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDepartments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            disabled={pageState.loading}
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="mt-4">
          <BulkActionsBar
            selectedCount={selectedIds.length}
            entityLabel="department"
            actions={[
              {
                key: 'delete',
                label: 'Delete Selected',
                icon: pageState.loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                onClick: handleBulkDelete,
                loading: pageState.loading,
                disabled: pageState.loading,
                tooltip: 'Delete selected departments',
                variant: 'destructive',
              },
            ]}
            onClear={() => setSelectedIds([])}
          />
        </div>
      )}

      {/* Dialogs */}
      <FilterDialog
        open={dialogState.filterDialogOpen}
        onOpenChange={(open) => setFilterDialogOpen(open)}
        statusFilter={filters.status}
        setStatusFilter={(status) => setFilters((prev: FilterState) => ({ ...prev, status }))}
        statusOptions={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        advancedFilters={filters as unknown as Record<string, string>}
        setAdvancedFilters={handleFilterChange as (filters: Record<string, string>) => void}
        fields={filterFields}
        onReset={handleFilterReset}
        onApply={() => setFilterDialogOpen(false)}
        activeAdvancedCount={Object.values({
          name: filters.name,
          code: filters.code,
          head: filters.head,
          minCourses: filters.minCourses,
          maxCourses: filters.maxCourses,
          minInstructors: filters.minInstructors,
          maxInstructors: filters.maxInstructors,
        }).filter(Boolean).length}
        title="Filter Departments"
        tooltip="Filter departments by multiple criteria. Use advanced filters for more specific conditions."
      />

      <ConfirmDeleteDialog
        open={dialogState.deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState(prev => ({ 
              ...prev, 
              deleteDialogOpen: false,
              departmentToDelete: null 
            }));
          }
        }}
        itemName={dialogState.departmentToDelete?.name ?? ''}
        onDelete={confirmDelete}
        onCancel={() => {
          setDialogState(prev => ({ 
            ...prev, 
            deleteDialogOpen: false,
            departmentToDelete: null 
          }));
        }}
        canDelete={true}
        deleteError={pageState.error}
        loading={pageState.isDeleting}
        description={dialogState.departmentToDelete ? 
          `Are you sure you want to delete the department \"${dialogState.departmentToDelete.name}\"? This action cannot be undone.` :
          'Are you sure you want to delete this department? This action cannot be undone.'}
      />

      <DepartmentForm
        open={dialogState.modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        initialData={modalDepartment}
        instructors={instructors}
        onSuccess={async () => {
          setModalOpen(false);
          await refreshDepartments();
        }}
      />

      <ExportDialog
        open={dialogState.exportDialogOpen}
        onOpenChange={(open) => setExportDialogOpen(open)}
        exportableColumns={exportableColumns}
        exportColumns={exportColumns}
        setExportColumns={setExportColumns}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        onExport={handleExport}
        title="Export Departments"
        tooltip="Export department data in various formats. Choose your preferred export options."
      />

      <SortDialog
        open={dialogState.sortDialogOpen}
        onOpenChange={(open) => setSortDialogOpen(open)}
        sortField={sortState.field}
        setSortField={(field) => setSortField(field as SortFieldKey)}
        sortOrder={sortState.order}
        setSortOrder={(order) => setSortOrder(order as SortOrder)}
        sortFieldOptions={departmentSortFieldOptions}
        onApply={() => {
          setSortFields([{ field: sortState.field, order: sortState.order }]);
        }}
        onReset={() => {
          setSortField('name');
          setSortOrder('asc');
          setSortFields([{ field: 'name', order: 'asc' }]);
        }}
        title="Sort Departments"
        tooltip="Sort departments by different fields. Choose the field and order to organize your list."
      />

      <ViewDialog
        open={dialogState.viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setViewDepartment(undefined);
        }}
        title={viewDepartment?.name || ''}
        subtitle={viewDepartment?.code}
        status={viewDepartment ? {
          value: viewDepartment.status,
          variant: viewDepartment.status === "active" ? "success" : "destructive"
        } : undefined}
        sections={[
          {
            title: "Department Information",
            fields: [
              { label: 'Head of Department', value: viewDepartment?.headOfDepartment || 'Not Assigned' },
              { label: 'Total Courses', value: viewDepartment?.courseOfferings?.length || 0, type: 'number' },
              { label: 'Total Instructors', value: viewDepartment?.totalInstructors || 0, type: 'number' }
            ]
          }
        ]}
        description={viewDepartment?.description}
        tooltipText="View detailed department information"
      />

      {/* Toast Notification Region */}
      <div role="region" aria-live="polite" className="sr-only" id="departments-toast-region"></div>
    </div>
  );
}
