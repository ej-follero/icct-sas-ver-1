"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import { DepartmentForm } from "@/components/forms/DepartmentForm";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import React from "react";
import { Plus, Filter, SortAsc, Eye, Pencil, Trash2, CheckSquare, Square, Download, Printer, Loader2, ArrowUp, ArrowDown, BadgeInfo, Hash, SortDesc, FileText, FileSpreadsheet, HelpCircle, Settings2, ArrowUpDown, MoreHorizontal, RefreshCw, ChevronRight, ListTodo } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ViewDialog } from '@/components/ViewDialog';
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { FilterDialog } from '@/components/FilterDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { SortDialog, SortFieldOption } from '@/components/SortDialog';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { PrintLayout } from '@/components/PrintLayout';
import { TableHeaderSection } from '@/components/TableHeaderSection';
import { TableCardView } from '@/components/TableCardView';
import { TableRowActions } from '@/components/TableRowActions';
import { TableList, TableListColumn } from '@/components/TableList';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableExpandedRow } from '@/components/TableExpandedRow';


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
  const [showPrint, setShowPrint] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEPARTMENT_COLUMNS.map(c => c.accessor));
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);

  const fuse = React.useMemo(() => new Fuse(departments, {
    keys: ["name", "code"],
    threshold: 0.4,
    includeMatches: true,
  }), [departments]);

  const fuzzyResults = React.useMemo(() => {
    if (!search) return departments.map((d, i) => ({ item: d, refIndex: i }));
    return fuse.search(search);
  }, [search, fuse]);

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
    if (filters.head) {
      result = result.filter(dept => dept.headOfDepartment?.toLowerCase().includes(filters.head.toLowerCase()));
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
            <TableRow key={course.id}>
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
        />
      )
    },
  ];

  // Table row renderer
  const renderRow = (item: Department) => {
    // Find the fuzzy result for this item (if any)
    const fuseResult = fuzzyResults.find(r => r.item.id === item.id);
    const nameMatches = (fuseResult && (fuseResult as any).matches)
      ? (fuseResult as any).matches.find((m: any) => m.key === "name")?.indices
      : undefined;
    const codeMatches = (fuseResult && (fuseResult as any).matches)
      ? (fuseResult as any).matches.find((m: any) => m.key === "code")?.indices
      : undefined;

    return (
      <TableRow
        key={item.id}
        className={
          `${selectedIds.includes(item.id) ? "bg-blue-50" : ""} hover:bg-blue-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400`
        }
        tabIndex={0}
        role="row"
        aria-label={`View details for department ${item.name}`}
        onClick={() => router.push(`/dashboard/list/departments/${item.id}`)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            router.push(`/dashboard/list/departments/${item.id}`);
          }
        }}
      >
        {columns.map((col, colIdx) => {
          if (col.accessor === "select") {
            return (
              <TableCell key={colIdx} className="w-12 text-center align-middle">
                <div className="flex justify-center items-center">
                  <SharedCheckbox checked={selectedIds.includes(item.id)} onCheckedChange={() => handleSelectRow(item.id)} aria-label={`Select department ${item.name}`} />
                </div>
              </TableCell>
            );
          }
          if (col.accessor === "name") {
            return (
              <TableCell key={colIdx} className="text-left align-middle">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(item.name, (fuzzyResults.find(r => r.item.id === item.id) as any)?.matches),
                  }}
                />
              </TableCell>
            );
          }
          if (col.accessor === "code") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(item.code, (fuzzyResults.find(r => r.item.id === item.id) as any)?.matches),
                  }}
                />
              </TableCell>
            );
          }
          if (col.accessor === "headOfDepartment") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.headOfDepartment}
              </TableCell>
            );
          }
          if (col.accessor === "description") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.description}
              </TableCell>
            );
          }
          if (col.accessor === "totalCourses") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.courseOfferings?.length || 0}
              </TableCell>
            );
          }
          if (col.accessor === "totalInstructors") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                {item.totalInstructors}
              </TableCell>
            );
          }
          if (col.accessor === "status") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                <Badge variant={item.status === "active" ? "success" : "destructive"}>
                  {item.status.toUpperCase()}
                </Badge>
              </TableCell>
            );
          }
          if (col.accessor === "actions") {
            return (
              <TableCell key={colIdx} className="text-center align-middle">
                <TableRowActions
                  onView={() => {
                    setViewDepartment(item);
                    setDialogState(prev => ({ ...prev, viewDialogOpen: true }));
                  }}
                  onEdit={() => {
                    setModalDepartment(item);
                    setDialogState(prev => ({ ...prev, modalOpen: true }));
                  }}
                  onDelete={() => {
                    handleDelete(item);
                  }}
                  itemName={item.name}
                  disabled={item.status === "active" || item.courseOfferings?.length > 0 || item.totalInstructors > 0}
                  deleteTooltip={getDeleteTooltip(item)}
                />
              </TableCell>
            );
          }
          // Default fallback
          return <TableCell key={colIdx} />;
        })}
      </TableRow>
    );
  };

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

  // Export selected to CSV handler
  const handleExportSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedDepartments = departments.filter(d => selectedIds.includes(d.id));
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
      ...selectedDepartments.map((dept) => [
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
    a.download = 'selected-departments.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selectedIds.length} department(s) exported to CSV.`);
  };

  // Count active advanced filters
  const activeAdvancedFilterCount = Object.values(filters).filter(Boolean).length;

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

  useEffect(() => {
    if (showPrint) {
      const timer = setTimeout(() => {
        window.print();
        setPageState((prev: PageState) => ({ ...prev, isPrinting: false }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPrint]);

  useEffect(() => {
    const mediaQueryList = window.matchMedia('print');
    const handlePrint = (e: MediaQueryListEvent) => setIsPrinting(e.matches);
    mediaQueryList.addEventListener('change', handlePrint);
    return () => mediaQueryList.removeEventListener('change', handlePrint);
  }, []);

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

  // Update TableRowActions to use new handleDelete
  const renderRowActions = (department: Department) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleView(department)}
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleEdit(department)}
        title="Edit Department"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(department)}
        title="Delete Department"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Normal UI */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-blue-100 flex-1 m-4 mt-0">
        {/* TOP */}
        <TableHeaderSection
          title="All Departments"
          description="Manage and view all department information"
          searchValue={search}
          onSearchChange={setSearch}
          onRefresh={refreshDepartments}
          isRefreshing={pageState.isRefreshing}
          onFilterClick={() => setFilterDialogOpen(true)}
          onSortClick={() => setSortDialogOpen(true)}
          onExportClick={() => setExportDialogOpen(true)}
          onPrintClick={handlePrint}
          onAddClick={() => { setModalDepartment(undefined); setDialogState(prev => ({ ...prev, modalOpen: true })); }}
          activeFilterCount={Object.values({
            name: filters.name,
            code: filters.code,
            head: filters.head,
            minCourses: filters.minCourses,
            maxCourses: filters.maxCourses,
            minInstructors: filters.minInstructors,
            maxInstructors: filters.maxInstructors,
          }).filter(Boolean).length}
          searchPlaceholder="Search departments..."
          addButtonLabel="Add Department"
          columnOptions={DEPARTMENT_COLUMNS.map(col => ({ accessor: col.accessor, label: typeof col.header === 'string' ? col.header : col.accessor }))}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />
        {/* Print Header and Table - Only visible when printing */}
        <div className="print-content">
          {/* Table layout for xl+ only */}
          <div className="hidden xl:block">
            <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white/70 shadow-md relative">
              {/* Loader overlay when refreshing */}
              {pageState.isRefreshing && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
              )}
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
          </div>
          {/* Card layout for small screens */}
          <div className="block xl:hidden">
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
        </div>

        {/* Bulk Actions Bar*/}
        {selectedIds.length > 0 && (
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
            className="mt-4 mb-2"
          />
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-6">
        <div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          </div>
          <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">Rows per page:</span>
    <Select value={String(itemsPerPage)} onValueChange={(value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    }}>
      <SelectTrigger className="w-24">
        <SelectValue placeholder={itemsPerPage} />
      </SelectTrigger>
      <SelectContent>
        {[10, 20, 30, 40, 50].map(size => (
          <SelectItem key={size} value={String(size)}>{size}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
        </div>

        {/* Filter Dialog */}
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
          advancedFilters={{
            name: filters.name,
            code: filters.code,
            head: filters.head,
            minCourses: filters.minCourses,
            maxCourses: filters.maxCourses,
            minInstructors: filters.minInstructors,
            maxInstructors: filters.maxInstructors,
          }}
          setAdvancedFilters={handleFilterChange}
          fields={[
            { key: 'name', label: 'Department Name', type: 'text', badgeType: 'active' },
            { key: 'code', label: 'Department Code', type: 'text', badgeType: 'active' },
            { key: 'head', label: 'Head of Department', type: 'text', badgeType: 'active' },
            { key: 'minCourses', label: 'Total Courses', type: 'number', badgeType: 'range', minKey: 'minCourses', maxKey: 'maxCourses' },
            { key: 'minInstructors', label: 'Total Instructors', type: 'number', badgeType: 'range', minKey: 'minInstructors', maxKey: 'maxInstructors' },
          ]}
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
        {/* DELETE CONFIRMATION DIALOG */}
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
            `Are you sure you want to delete the department "${dialogState.departmentToDelete.name}"? This action cannot be undone.` :
            'Are you sure you want to delete this department? This action cannot be undone.'}
        />
        {/* MODAL FOR CREATE/EDIT */}
      <DepartmentForm
        open={dialogState.modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        initialData={modalDepartment}
        instructors={instructors}
        onSuccess={async () => {
          setModalOpen(false);
          // Refresh department list after create/edit
          setLoading(true);
          try {
            const res = await fetch('/api/departments');
            if (!res.ok) throw new Error('Failed to fetch departments');
            const data = await res.json();
            setDepartments(data);
          } catch {
            setDepartments([]);
          }
          setLoading(false);
        }}
      />
      {/* Export Dialog */}
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
      {/* Sort Dialog */}
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
      {/* View Dialog */}
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
      </div>
    </div>
  );
}
