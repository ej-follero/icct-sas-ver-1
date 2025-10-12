"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { DepartmentForm } from "@/components/forms/DepartmentForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import Fuse from "fuse.js";
import React from "react";
import { Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, UserCheck, UserX, Users, UserPlus, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, Calendar, MapPin, BookOpen } from "lucide-react";
import { ImportDialog } from "@/components/reusable/Dialogs/ImportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
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
import BulkActionsDialog from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { SummaryCardSkeleton, PageSkeleton } from '@/components/reusable/Skeleton';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { ExportService } from '@/lib/services/export.service';



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
  headOfDepartmentDetails?: {
    firstName: string;
    lastName: string;
    middleName?: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    officeLocation?: string;
    officeHours?: string;
  };
  description?: string;
  courseOfferings: Course[];
  status: "active" | "inactive";
  totalInstructors: number;
  logo?: string;
}

type SortFieldKey = 'name' | 'code' | 'totalInstructors' | 'totalCourses' | 'status' | 'head';
type SortOrder = 'asc' | 'desc';
type MultiSortField = { field: SortFieldKey; order: SortOrder };

type LocalSortOption = { value: string; label: string };
const departmentSortFieldOptions: LocalSortOption[] = [
  { value: 'name', label: 'Department Name' },
  { value: 'code', label: 'Department Code' },
  { value: 'head', label: 'Head of Department' },
  { value: 'totalCourses', label: 'Total Courses' },
  { value: 'totalInstructors', label: 'Total Instructors' },
  { value: 'status', label: 'Status' },
];



// Define column configuration once - Enhanced responsive design
const DEPARTMENT_COLUMNS: TableListColumn<Department>[] = [
  { 
    header: "Logo", 
    accessor: "logo", 
    className: "text-center align-middle w-10 sm:w-12 min-w-[40px] sm:min-w-[48px]", 
    render: (item: Department) => (
      item.logo ? (
        <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full overflow-hidden border-2 border-blue-200">
          <img
            src={item.logo}
            alt={`${item.name} logo`}
            className="object-cover w-full h-full"
          />
        </div>
      ) : (
        <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
          <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
        </div>
      )
    )
  },
  { 
    header: "Department Name", 
    accessor: "name", 
    className: "text-center align-middle min-w-[100px] sm:min-w-[120px] max-w-[150px] sm:max-w-[200px] whitespace-normal font-medium text-blue-900 text-xs sm:text-sm", 
    sortable: true 
  },
  { 
    header: "Code", 
    accessor: "code", 
    className: "text-center align-middle min-w-[60px] sm:min-w-[80px] max-w-[80px] sm:max-w-[100px] whitespace-nowrap text-blue-900 text-xs sm:text-sm", 
    sortable: true 
  },
  { 
    header: "Head of Department", 
    accessor: "headOfDepartment", 
    className: "text-center align-middle min-w-[100px] sm:min-w-[120px] max-w-[150px] sm:max-w-[180px] whitespace-normal text-blue-900 text-xs sm:text-sm", 
    render: (item: Department) => (
      <div className="text-center">
        <div className="font-medium text-blue-900">
          {item.headOfDepartmentDetails ? (
            <div className="font-semibold truncate text-xs sm:text-sm">
              {item.headOfDepartmentDetails.firstName} {item.headOfDepartmentDetails.middleName ? item.headOfDepartmentDetails.middleName + ' ' : ''}{item.headOfDepartmentDetails.lastName}
            </div>
          ) : (
            <span className={`${item.headOfDepartment === 'Not Assigned' ? 'text-gray-500 italic' : 'text-blue-900'} truncate text-xs sm:text-sm`}>
              {item.headOfDepartment}
            </span>
          )}
        </div>
      </div>
    ),
    sortable: true 
  },
  { 
    header: "Description", 
    accessor: "description", 
    className: "text-center align-middle min-w-[80px] sm:min-w-[100px] max-w-[120px] sm:max-w-[150px] whitespace-normal text-blue-900 text-xs sm:text-sm", 
    sortable: true 
  },
  { 
    header: "Total Courses", 
    accessor: "totalCourses", 
    className: "text-center align-middle min-w-[60px] sm:min-w-[80px] max-w-[80px] sm:max-w-[100px] whitespace-normal text-blue-900 text-xs sm:text-sm", 
    render: (item: Department) => item.courseOfferings?.length || 0,
    sortable: true
  },
  { 
    header: "Total Instructors", 
    accessor: "totalInstructors", 
    className: "text-center align-middle min-w-[60px] sm:min-w-[80px] max-w-[80px] sm:max-w-[100px] whitespace-normal text-blue-900 text-xs sm:text-sm", 
    sortable: true 
  },
  { 
    header: "Status", 
    accessor: "status", 
    className: "text-center align-middle min-w-[60px] sm:min-w-[80px] max-w-[80px] sm:max-w-[100px] whitespace-nowrap", 
    render: (item: Department) => (
      <Badge variant={item.status === "active" ? "success" : "destructive"} className="text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full flex justify-center">
        <span className="text-xs">{item.status.toUpperCase()}</span>
      </Badge>
    ),
    sortable: true
  },
];

  // Define column options for the dialog
  const COLUMN_OPTIONS: ColumnOption[] = [
    {
      accessor: "logo",
      header: "Logo",
      description: "Department logo or default icon",
      category: "Visual"
    },
    {
      accessor: "name",
      header: "Department Name",
      description: "Full name of the department",
      category: "Basic Info",
      required: true
    },
    {
      accessor: "code",
      header: "Code",
      description: "Department code/abbreviation",
      category: "Basic Info",
      required: true
    },
    {
      accessor: "headOfDepartment",
      header: "Head of Department",
      description: "Department head or leader",
      category: "Management"
    },
    {
      accessor: "description",
      header: "Description",
      description: "Department description and details",
      category: "Basic Info"
    },
    {
      accessor: "totalCourses",
      header: "Total Courses",
      description: "Number of courses offered by the department",
      category: "Statistics"
    },
    {
      accessor: "totalInstructors",
      header: "Total Instructors",
      description: "Number of instructors in the department",
      category: "Statistics"
    },
    {
      accessor: "status",
      header: "Status",
      description: "Active or inactive status",
      category: "Status"
    }
  ];

// API response types
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// State interfaces
interface PageState {
  loading: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  isExporting: boolean;
  error: string | null;
  operationInProgress: {
    type: 'fetch' | 'refresh' | 'delete' | 'export' | null;
    retryCount: number;
  };
}

interface SortState {
  field: SortFieldKey;
  order: SortOrder;
  fields: MultiSortField[];
}

interface DialogState {
  modalOpen: boolean;
  deleteDialogOpen: boolean;
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

// Validation utilities
const validateDepartment = (dept: any): dept is Department => {
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

const validateDepartments = (data: any[]): data is Department[] => {
  return Array.isArray(data) && data.every(validateDepartment);
};

// Retry utility
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T,>(
  operation: () => Promise<T>,
  retryCount: number = 0
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return retryOperation(operation, retryCount + 1);
    }
    throw error;
  }
};

// Error message utility
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
    error: null,
    operationInProgress: {
      type: null,
      retryCount: 0
    }
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [sortState, setSortState] = useState<SortState>({
    field: 'name',
    order: 'asc',
    fields: [{ field: 'name', order: 'asc' }]
  });

  const [dialogState, setDialogState] = useState<DialogState>({
    modalOpen: false,
    deleteDialogOpen: false,
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



  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEPARTMENT_COLUMNS.map(c => c.accessor));
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  
  // Quick filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [headFilter, setHeadFilter] = useState('all');

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
    
    // Apply quick filters
    result = result.filter(dept => {
      // Status filter
      if (statusFilter !== 'all' && dept.status !== statusFilter) return false;
      
      // Head filter
      if (headFilter !== 'all') {
        const hasHead = dept.headOfDepartment && 
                       dept.headOfDepartment.trim() !== '' && 
                       dept.headOfDepartment.trim() !== 'Not Assigned';
        
        // Debug logging for head filter
        if (headFilter === 'unassigned') {
          console.log(`Head Filter Debug - Dept: ${dept.name}, headOfDepartment: "${dept.headOfDepartment}", hasHead: ${hasHead}`);
        }
        
        if (headFilter === 'assigned' && !hasHead) return false;
        if (headFilter === 'unassigned' && hasHead) return false;
      }
      
      return true;
    });
    
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
  }, [fuzzyResults, sortState.fields, statusFilter, headFilter]);

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
      className: 'w-10 text-center px-1 py-1',
      expandedContent: (item: Department) => (
        <td colSpan={columns.length} className="bg-transparent px-0 py-0">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100 p-3 sm:p-4 md:p-6">
            {/* Course Offerings Section */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 sm:px-4 py-2 sm:py-3">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  Course Offerings ({item.courseOfferings?.length || 0})
                </h3>
              </div>
              <div className="p-3 sm:p-4">
                {item.courseOfferings && item.courseOfferings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-center py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-700">Course Name</th>
                          <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-700">Code</th>
                          <th className="text-center py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-center py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-700">Students</th>
                          <th className="text-center py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-700">Sections</th>
                          <th className="text-center py-2 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-gray-700">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(item.courseOfferings || []).map((course) => (
                          <tr key={course.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                            <td className="py-2 sm:py-3 px-2 sm:px-3">
                              <div className="font-medium text-blue-900 text-xs sm:text-sm">{course.name}</div>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-3">
                              <code className="bg-gray-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-mono text-gray-700">{course.code}</code>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                              <Badge variant={course.status === 'active' ? 'success' : 'destructive'} className="text-xs">
                                {course.status}
                              </Badge>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                              <span className="font-semibold text-blue-900 text-xs sm:text-sm">{course.totalStudents || 0}</span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                              <span className="font-semibold text-blue-900 text-xs sm:text-sm">{course.totalSections || 0}</span>
                            </td>
                            <td className="py-2 sm:py-3 px-2 sm:px-3">
                              <span className="text-xs sm:text-sm text-gray-600">
                                {course.description || 'No description available'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-gray-500 text-xs sm:text-sm">No courses offered by this department</p>
                    <p className="text-gray-400 text-xs mt-1">Courses can be added through the course management system</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>
      ),
    },
    {
      header: (
        <div className="flex justify-center items-center">
          <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onCheckedChange={handleSelectAll} />
        </div>
      ),
      accessor: 'select',
      className: 'w-8 sm:w-10 text-center px-0.5 sm:px-1 py-1', // responsive padding
    },
    ...DEPARTMENT_COLUMNS.filter(col => visibleColumns.includes(col.accessor)),
    { 
      header: "Actions", 
      accessor: "actions", 
      className: "text-center align-middle px-0.5 sm:px-1 py-1 min-w-[80px] sm:min-w-[100px]", // responsive padding and width
      render: (item: Department) => (
        <div className="flex gap-0.5 sm:gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Department"
                  className="hover:bg-blue-50 h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => handleView(item)}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                View details
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit Department"
                  className="hover:bg-green-50 h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => handleEdit(item)}
                >
                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                {getEditTooltip(item) || "Edit"}
              </TooltipContent>
            </Tooltip>
            {item.status === "inactive" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Reactivate Department"
                    className="hover:bg-green-50 h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => handleReactivate(item)}
                    disabled={pageState.isDeleting}
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                  Reactivate department
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Deactivate Department"
                      className="hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => handleDelete(item)}
                      disabled={pageState.isDeleting}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                  {getDeleteTooltip(item) || "Deactivate"}
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )
    },
  ];

  // Update exportableColumns to use the shared configuration with safe typing
  type DepartmentExportKey = keyof Department | 'totalCourses';
  const exportableColumns: { key: DepartmentExportKey; label: string }[] = DEPARTMENT_COLUMNS.map(col => ({
    key: col.accessor as DepartmentExportKey,
    label: typeof col.header === 'string' ? col.header : col.accessor
  }));

  // Update printColumns to use the shared configuration
  const printColumns = DEPARTMENT_COLUMNS.map(col => ({
    header: typeof col.header === 'string' ? col.header : col.accessor,
    accessor: col.accessor
  })).filter(col => col.accessor !== 'logo'); // Exclude logo from print as it's not text

  // Add export columns state
  const [exportColumns, setExportColumns] = useState<DepartmentExportKey[]>(exportableColumns.map(col => col.key));

  // Additional state variables
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortFieldKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [sortFields, setSortFields] = useState<MultiSortField[]>([{ field: 'name', order: 'asc' }]);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [selectedDepartmentsForBulkAction, setSelectedDepartmentsForBulkAction] = useState<Department[]>([]);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeLogos, setIncludeLogos] = useState<boolean>(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [lastActionTime, setLastActionTime] = useState<string>("2 minutes ago");
  // Add state for bulk deactivate dialog
  const [bulkDeactivateDialogOpen, setBulkDeactivateDialogOpen] = useState(false);
  const [bulkReactivateDialogOpen, setBulkReactivateDialogOpen] = useState(false);

  // Add at the top of the component (inside DepartmentListPage)
  const [bulkActions, setBulkActions] = useState({
    assignInstructors: false,
    archiveRestore: false,
    assignCourses: false,
  });

  const handleBulkActionChange = (action: keyof typeof bulkActions) => {
    setBulkActions(prev => ({ ...prev, [action]: !prev[action] }));
  };

  const handleBulkActionExecute = async () => {
    setPageState(prev => ({ ...prev, loading: true }));
    try {
      let successCount = 0;
      const selectedDepartments = departments.filter(d => selectedIds.includes(d.id));
      
      if (bulkActions.assignInstructors) {
        // Implement assign instructors logic
        const response = await fetch('/api/departments/bulk/assign-instructors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            departmentIds: selectedIds,
            instructorIds: [] // This could be enhanced to allow instructor selection
          }),
        });
        
        if (response.ok) {
          successCount++;
          toast.success(`Instructors assigned to ${selectedDepartments.length} departments`);
        } else {
          throw new Error('Failed to assign instructors');
        }
      }
      
      if (bulkActions.archiveRestore) {
        // Implement archive/restore logic based on current status
        const activeDepartments = selectedDepartments.filter(d => d.status === 'active');
        const inactiveDepartments = selectedDepartments.filter(d => d.status === 'inactive');
        
        if (activeDepartments.length > 0) {
          // Archive active departments
          const updatePromises = activeDepartments.map(async (dept) => {
            const response = await fetch(`/api/departments/${dept.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'inactive' }),
            });
            if (!response.ok) throw new Error(`Failed to archive department ${dept.id}`);
            return response.json();
          });
          
          await Promise.all(updatePromises);
          toast.success(`${activeDepartments.length} departments archived`);
        }
        
        if (inactiveDepartments.length > 0) {
          // Restore inactive departments
          const updatePromises = inactiveDepartments.map(async (dept) => {
            const response = await fetch(`/api/departments/${dept.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'active' }),
            });
            if (!response.ok) throw new Error(`Failed to restore department ${dept.id}`);
            return response.json();
          });
          
          await Promise.all(updatePromises);
          toast.success(`${inactiveDepartments.length} departments restored`);
        }
        
        // Update local state
        setDepartments(prev => prev.map(d => {
          if (selectedIds.includes(d.id)) {
            return { ...d, status: d.status === 'active' ? 'inactive' as const : 'active' as const };
          }
          return d;
        }));
        
        successCount++;
      }
      
      if (bulkActions.assignCourses) {
        // Implement assign courses logic
        const response = await fetch('/api/departments/bulk/assign-courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            departmentIds: selectedIds,
            courseIds: [] // This could be enhanced to allow course selection
          }),
        });
        
        if (response.ok) {
          successCount++;
          toast.success(`Courses assigned to ${selectedDepartments.length} departments`);
        } else {
          throw new Error('Failed to assign courses');
        }
      }
      
      // Clear selections and reset actions
      setSelectedIds([]);
      setBulkActions({ assignInstructors: false, archiveRestore: false, assignCourses: false });
      
      if (successCount > 0) {
        await refreshDepartments(); // Refresh data to reflect changes
      }
      
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error(`Bulk action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPageState(prev => ({ ...prev, loading: false }));
    }
  };

  // Helper function to make an image rounded
  const makeImageRounded = async (imageData: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        
        // Calculate position to center the image
        const x = (size - img.width) / 2;
        const y = (size - img.height) / 2;
        
        // Draw the image
        ctx.drawImage(img, x, y);
        
        // Convert to base64
        const roundedImageData = canvas.toDataURL('image/png', 0.8);
        resolve(roundedImageData);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for rounding'));
      };
      
      img.src = imageData;
    });
  };

  // Helper function to create a default avatar
  const createDefaultAvatar = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 100;
      canvas.height = 100;
      
      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();
      
      // Draw a simple building icon with rounded background
      ctx.fillStyle = '#e5e7eb'; // Light gray background
      ctx.fillRect(0, 0, 100, 100);
      
      ctx.fillStyle = '#6b7280'; // Gray building
      ctx.fillRect(20, 40, 60, 50);
      
      // Windows
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(30, 50, 10, 10);
      ctx.fillRect(60, 50, 10, 10);
      ctx.fillRect(30, 70, 10, 10);
      ctx.fillRect(60, 70, 10, 10);
      
      // Door
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(45, 70, 10, 20);
      
      // Convert to base64
      return canvas.toDataURL('image/png', 0.8);
    } else {
      throw new Error('Failed to create canvas context');
    }
  };

  // Helper function to convert image to base64 with better CORS handling
  const convertImageToBase64 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Handle relative URLs by making them absolute
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;
      console.log('🖼️ Converting image URL:', fullUrl);
      
      const img = new window.Image();
      
      // Try with CORS first
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          console.log('✅ Image loaded successfully, dimensions:', img.width, 'x', img.height);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Set canvas size to image size (max 100x100 for PDF)
          const maxSize = 100;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 - try PNG first, fallback to JPEG
          let dataURL;
          try {
            dataURL = canvas.toDataURL('image/png', 0.8);
          } catch (pngError) {
            console.log('PNG conversion failed, trying JPEG...');
            dataURL = canvas.toDataURL('image/jpeg', 0.8);
          }
          
          console.log('✅ Successfully converted to base64, length:', dataURL.length);
          console.log('📊 Base64 data starts with:', dataURL.substring(0, 50));
          console.log('🖼️ Image format:', dataURL.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG');
          resolve(dataURL);
        } catch (error) {
          console.error('❌ Error converting image to base64:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Error loading image with CORS:', error);
        console.error('🔄 Trying without CORS...');
        
        // Fallback: try without CORS
        const imgNoCors = new window.Image();
        imgNoCors.onload = () => {
          try {
            console.log('✅ Image loaded without CORS, dimensions:', imgNoCors.width, 'x', imgNoCors.height);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            
            canvas.width = imgNoCors.width;
            canvas.height = imgNoCors.height;
            
            // Draw image to canvas
            ctx.drawImage(imgNoCors, 0, 0);
            
            // Convert to base64
            const dataURL = canvas.toDataURL('image/png', 0.8);
            console.log('✅ Successfully converted to base64 (no CORS), length:', dataURL.length);
            resolve(dataURL);
          } catch (error) {
            console.error('❌ Error converting image to base64 (no CORS):', error);
            reject(error);
          }
        };
        
        imgNoCors.onerror = () => {
          console.error('❌ Failed to load image even without CORS:', fullUrl);
          reject(new Error('Failed to load image - CORS issue or invalid URL'));
        };
        
        imgNoCors.src = fullUrl;
      };
      
      img.src = fullUrl;
    });
  };

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

      // Filter out logo column from exportable columns if not including logos
      const columnsToExport = includeLogos 
        ? exportableColumns.filter(col => exportColumns.includes(col.key) && col.key !== 'logo')
        : exportableColumns.filter(col => exportColumns.includes(col.key));
      
      const headers = columnsToExport.map(col => col.label);
      const rows = filteredDepartments.map((dept) =>
        columnsToExport.map((col) => {
          if (col.key === 'totalCourses') return String(dept.courseOfferings?.length || 0);
          if (col.key === 'totalInstructors') return String(dept.totalInstructors || 0);
          if (col.key === 'logo') return dept.logo ? 'Yes' : 'No';
          return String(dept[col.key as keyof Department] || '');
        })
      );

      switch (exportFormat) {
        case 'pdf':
          console.log('Starting PDF export with logos:', includeLogos);
          console.log('Total departments to export:', filteredDepartments.length);
          const doc = new jsPDF({
            orientation: pdfOrientation,
            unit: 'mm',
            format: 'a4'
          });
          
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

          // Prepare table data with logos if enabled
          let tableHeaders = headers;
          let tableRows = rows;
          let logoDataMap = new Map<number, string>(); // Store logo data by row index
          
          if (includeLogos) {
            console.log('Processing logos for PDF export...');
            
            // Check if headers already contain a Logo column and remove it
            const headersWithoutLogo = headers.filter(header => header !== 'Logo');
            tableHeaders = ['Logo', ...headersWithoutLogo];
            
            // Explicitly fetch and convert all logos to base64 first
            console.log('Fetching and converting logos to base64...');
            const logoPromises = filteredDepartments.map(async (dept, index) => {
              let logoData = '';
              
              console.log(`🔍 Department ${dept.name}: logo field =`, dept.logo);
              console.log(`🔍 Department ${dept.name}: logo type =`, typeof dept.logo);
              
              if (dept.logo) {
                console.log(`Processing logo for ${dept.name}:`, dept.logo);
                try {
                  logoData = await convertImageToBase64(dept.logo);
                  console.log(`✅ Successfully converted logo for ${dept.name}, data length:`, logoData.length);
                  console.log(`Logo data starts with data:image:`, logoData.startsWith('data:image'));
                  
                  if (!logoData.startsWith('data:image')) {
                    console.error(`❌ Invalid image data for ${dept.name}:`, logoData.substring(0, 100));
                    throw new Error('Invalid image data');
                  }
                  
                  // Make the logo rounded
                  logoData = await makeImageRounded(logoData);
                  console.log(`✅ Made logo rounded for ${dept.name}`);
                } catch (error) {
                  console.warn(`❌ Failed to convert logo for department ${dept.name}:`, error);
                  // Don't re-throw, create default avatar instead
                  console.log(`🔄 Creating default avatar for ${dept.name} due to logo conversion failure`);
                  logoData = createDefaultAvatar();
                }
              } else {
                console.log(`No logo for ${dept.name}, creating default avatar`);
                logoData = createDefaultAvatar();
                console.log(`✅ Created default avatar for ${dept.name}`);
              }
              
              return { index, logoData, deptName: dept.name };
            });
            
            // Wait for all logo conversions to complete
            const logoResults = await Promise.all(logoPromises);
            
            console.log(`📊 Logo conversion results:`, logoResults.length);
            
            // Store logo data in map
            logoResults.forEach(({ index, logoData, deptName }) => {
              logoDataMap.set(index, logoData);
              console.log(`✅ Stored logo data for ${deptName} at index ${index}, data length: ${logoData.length}`);
              console.log(`📋 Logo data preview:`, logoData.substring(0, 100) + '...');
            });
            
            console.log(`✅ Logo processing completed. Total logos: ${logoDataMap.size}`);
            console.log('Logo data map keys:', Array.from(logoDataMap.keys()));
            
            // Create table rows with placeholders (logos will be added via didDrawCell)
            tableRows = filteredDepartments.map((dept, index) => {
              const rowData = rows[index];
              const rowDataWithoutLogo = rowData.filter((_, colIndex) => headers[colIndex] !== 'Logo');
              const newRow = ['LOGO_PLACEHOLDER', ...rowDataWithoutLogo];
              console.log(`📋 Row ${index} for ${dept.name}:`, newRow);
              console.log(`📋 Row ${index} logoDataMap has key:`, logoDataMap.has(index));
              return newRow;
            });
          }

          // Add some spacing
          doc.setFontSize(12);
          
          console.log('Table headers:', tableHeaders);
          console.log('Table rows:', tableRows);
          console.log('Logo data map size:', logoDataMap.size);
          console.log('Logo data map keys:', Array.from(logoDataMap.keys()));
          
          // Debug: Log each entry in logoDataMap
          logoDataMap.forEach((logoData, index) => {
            console.log(`🔍 LogoDataMap[${index}]: length=${logoData.length}, startsWith=data:image: ${logoData.startsWith('data:image')}`);
          });



          // Create table with didDrawCell callback for logo images
          const tableResult = autoTable(doc, {
            head: [tableHeaders] as string[][],
            body: tableRows as any[][],
            startY: 35,
            styles: { 
              fontSize: 8,
              cellPadding: 3,
              overflow: 'linebreak',
              cellWidth: 'wrap',
              minCellHeight: 18, // Ensure cells are tall enough for 10mm rounded images
            },
            headStyles: { 
              fillColor: [12, 37, 86],
              textColor: [255, 255, 255],
              halign: 'center',
              fontStyle: 'bold',
            },
            columnStyles: includeLogos ? {
              0: { cellWidth: 20, halign: 'center', valign: 'middle' }, // Logo column - wider and centered
              1: { cellWidth: 'auto' }, // Department Name
              2: { cellWidth: 'auto' }, // Code
              3: { cellWidth: 'auto' }, // Head of Department
              4: { cellWidth: 'auto' }, // Description
              5: { cellWidth: 'auto', halign: 'center' }, // Total Courses
              6: { cellWidth: 'auto', halign: 'center' }, // Total Instructors
              7: { cellWidth: 'auto', halign: 'center' }, // Status
            } : {
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
            didParseCell: includeLogos ? (data) => {
              console.log(`🎨 didParseCell called: column=${data.column.index}, row=${data.row.index}, section=${data.cell.section}, text="${data.cell.text[0]}"`);
              // Handle logo images in the first column (logo column) - but NOT the header row
              if (data.column.index === 0 && data.cell.section === 'body') {
                const cellText = data.cell.text[0];
                console.log(`🎨 didParseCell: Logo column cell detected: "${cellText}" at row ${data.row.index}`);
                
                if (cellText === 'LOGO_PLACEHOLDER') {
                  // FIXED: Use data.row.index directly (no need to subtract 1)
                  const logoData = logoDataMap.get(data.row.index);
                  
                  console.log(`🔍 Looking for logo data at index ${data.row.index}, found:`, !!logoData);
                  console.log(`🔍 Total logoDataMap size:`, logoDataMap.size);
                  console.log(`🔍 Available keys:`, Array.from(logoDataMap.keys()));
                  
                  // Always clear the placeholder text, regardless of whether we have logo data
                  // The didDrawCell will handle adding the image or fallback text
                  data.cell.text = [''];
                  console.log(`✅ Cleared cell text for row ${data.row.index}`);
                } else {
                  console.log(`⚠️ Cell text is not 'LOGO_PLACEHOLDER': "${cellText}"`);
                }
              } else if (data.column.index === 0 && data.cell.section === 'head') {
                console.log(`📋 Header row detected, keeping text: "${data.cell.text[0]}"`);
              }
            } : undefined,
            didDrawCell: includeLogos ? (data) => {
              console.log(`🎨 didDrawCell called: column=${data.column.index}, row=${data.row.index}, section=${data.cell.section}, text="${data.cell.text[0]}"`);
              // Handle logo images in the first column (logo column) - but NOT the header row
              if (data.column.index === 0 && data.cell.section === 'body') {
                const cellText = data.cell.text[0];
                console.log(`🎨 didDrawCell: Logo column cell detected: "${cellText}" at row ${data.row.index}`);
                
                // Process all body cells in the logo column (including first row)
                if (cellText === '' || cellText === 'LOGO_PLACEHOLDER') {
                  // FIXED: Use data.row.index directly (no need to subtract 1)
                  const logoData = logoDataMap.get(data.row.index);
                  
                  console.log(`🔍 Looking for logo data at index ${data.row.index}, found:`, !!logoData);
                  
                  if (logoData) {
                    try {
                      // Detect image format from data URL
                      const imageFormat = logoData.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
                      
                      // Calculate image dimensions and position
                      const imgWidth = 10; // 10mm width for rounded images
                      const imgHeight = 10; // 10mm height for rounded images
                      const x = data.cell.x + (data.cell.width - imgWidth) / 2; // Center horizontally
                      const y = data.cell.y + (data.cell.height - imgHeight) / 2; // Center vertically
                      
                      console.log(`📐 Cell position: x=${data.cell.x}, y=${data.cell.y}, width=${data.cell.width}, height=${data.cell.height}`);
                      console.log(`📐 Image position: x=${x}, y=${y}, size=${imgWidth}x${imgHeight}`);
                      console.log(`📊 Logo data length:`, logoData.length);
                      console.log(`🖼️ Image format:`, imageFormat);
                      console.log(`🖼️ Logo data preview:`, logoData.substring(0, 100) + '...');
                      
                      // Add the image to the PDF with correct format
                      doc.addImage(logoData, imageFormat, x, y, imgWidth, imgHeight);
                      console.log(`✅ Successfully added logo for row ${data.row.index}`);
                    } catch (error) {
                      console.error(`❌ Error adding logo for row ${data.row.index}:`, error);
                      console.error(`❌ Error details:`, error instanceof Error ? error.message : String(error));
                      // Don't set text back, leave it empty
                    }
                  } else {
                    console.log(`🏢 No logo data found for row ${data.row.index}`);
                    // Don't set text back, leave it empty
                  }
                }
              } else if (data.column.index === 0 && data.cell.section === 'head') {
                console.log(`📋 Header row detected, keeping text: "${data.cell.text[0]}"`);
              }
            } : undefined,
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
      setLastActionTime("Just now");
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

  // Build flat rows for export service
  const buildDepartmentExportRows = (list: Department[]) => {
    return list.map((dept) => ({
      departmentName: dept.name,
      code: dept.code,
      headOfDepartment: dept.headOfDepartment || 'Not Assigned',
      status: (dept.status || 'inactive').toUpperCase(),
      totalInstructors: dept.totalInstructors || 0,
      totalCourses: dept.courseOfferings?.length || 0,
      description: dept.description || ''
    }));
  };

  // Centralized export using shared ExportService
  const exportDepartments = async (
    format: 'pdf' | 'csv' | 'excel',
    rows?: Array<Record<string, any>>,
    filenameBase?: string
  ) => {
    const dataRows = rows || buildDepartmentExportRows(filteredDepartments);
    const filename = filenameBase || `departments-${new Date().toISOString().split('T')[0]}`;
    const selectedColumns = ['departmentName','code','headOfDepartment','status','totalInstructors','totalCourses','description'];

    const exportData = {
      type: 'department',
      data: dataRows,
      filters: { status: statusFilter, head: headFilter }
    };

    const options = {
      format,
      filename,
      includeCharts: format === 'pdf',
      includeFilters: true,
      includeSummary: false,
      includeTable: format !== 'pdf',
      selectedColumns
    } as const;

    await ExportService.exportAnalytics(exportData as any, options as any);
  };

  // Print handler using PrintLayout
  const handlePrint = () => {
    const printData = filteredDepartments.map((d) => ({
      ...d,
      totalCourses: d.courseOfferings?.length?.toString() || '0',
      totalInstructors: d.totalInstructors?.toString() || '0',
      logo: d.logo ? 'Yes' : 'No',
    }));
    const printFunction = PrintLayout({
      title: 'Department List',
      data: printData,
      columns: printColumns,
      totalItems: filteredDepartments.length,
    });
    printFunction();
    setLastActionTime("Just now");
  };

  // Bulk deactivate handler
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeactivateDialogOpen(true);
  };

  // Actual deactivation logic
  const confirmBulkDeactivate = async () => {
    setPageState(prev => ({ ...prev, loading: true }));
    try {
      // Update all selected departments to inactive status
      const updatePromises = selectedIds.map(async (id) => {
        const response = await fetch(`/api/departments/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'inactive'
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to deactivate department ${id}`);
        }
        return response.json();
      });

      await Promise.all(updatePromises);
      setDepartments(prev => prev.map(d =>
        selectedIds.includes(d.id)
          ? { ...d, status: 'inactive' as const }
          : d
      ));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} department(s) deactivated successfully.`);
    } catch (err) {
      toast.error("Failed to deactivate departments.");
    }
    setPageState(prev => ({ ...prev, loading: false }));
    setBulkDeactivateDialogOpen(false);
  };

  // Add handleSort function
  const handleSort = (field: string) => {
    console.log('Sorting by field:', field);
    setSortState(prev => {
      const isSameField = prev.field === field;
      const newOrder = isSameField && prev.order === 'asc' ? 'desc' : 'asc';
      
      return {
        field: field as SortFieldKey,
        order: newOrder,
        fields: [{ field: field as SortFieldKey, order: newOrder }]
      };
    });
  };

  // Fetch departments and instructors from API with proper error handling, retry logic, and validation
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting data fetch...');
        setPageState(prev => ({ 
          ...prev, 
          loading: true, 
          error: null,
          operationInProgress: { type: 'fetch', retryCount: 0 }
        }));

        // Test database connectivity first
        try {
          const testResponse = await fetch('/api/test-db');
          const testData = await testResponse.json();
          console.log('Database test result:', testData);
        } catch (testError) {
          console.error('Database test failed:', testError);
        }

        // Fetch departments and instructors in parallel
        const [departmentsResponse, instructorsResponse] = await Promise.all([
          retryOperation(async () => {
            const res = await fetch('/api/departments');
            if (!res.ok) {
              throw new Error(`Failed to fetch departments: ${res.statusText}`);
            }
            return res;
          }),
          retryOperation(async () => {
            const res = await fetch('/api/instructors');
            if (!res.ok) {
              throw new Error(`Failed to fetch instructors: ${res.statusText}`);
            }
            return res;
          })
        ]);

        const [departmentsData, instructorsData] = await Promise.all([
          departmentsResponse.json(),
          instructorsResponse.json()
        ]);
        
        console.log('Instructors data received:', instructorsData);
        console.log('Sample instructor raw data:', instructorsData[0]);
        
        if (departmentsData.error) {
          throw new Error(departmentsData.error);
        }

        if (!departmentsData.data || !validateDepartments(departmentsData.data)) {
          throw new Error('Invalid department data received from server');
        }

        // Transform instructors data to match the expected format
        const transformedInstructors = (Array.isArray(instructorsData) ? instructorsData : []).map((instructor: any) => {
          // The API now returns the correct format, but let's ensure compatibility
          if (instructor.name) {
            // Already in correct format
            return {
              id: instructor.id,
              name: instructor.name
            };
          } else {
            // Fallback for old format
            const fullName = [
              instructor.firstName,
              instructor.middleName,
              instructor.lastName
            ].filter(Boolean).join(' ').trim();
            
            return {
              id: instructor.instructorId?.toString() || instructor.id,
              name: fullName
            };
          }
        });

        console.log('Departments data received:', departmentsData);
        console.log('Departments array length:', departmentsData.data?.length);
        console.log('Sample department:', departmentsData.data?.[0]);
        
        setDepartments(departmentsData.data);
        setInstructors(transformedInstructors);
        console.log('Transformed instructors:', transformedInstructors);
        console.log('Setting instructors state with length:', transformedInstructors.length);

        setPageState(prev => ({ 
          ...prev, 
          loading: false,
          operationInProgress: { type: null, retryCount: 0 }
        }));
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'load data');
        setPageState(prev => ({ 
          ...prev, 
          error: errorMessage,
          loading: false,
          operationInProgress: { type: null, retryCount: 0 }
        }));
        toast.error(errorMessage);
      }
    };

    fetchData();
  }, []);

  // Reset pagination on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortState.fields]);

  // Debug summary cards data
  useEffect(() => {
    if (!pageState.loading && departments.length > 0) {
      console.log('Summary cards data:', {
        totalDepartments: departments.length,
        activeDepartments: departments.filter(d => d.status === 'active').length,
        inactiveDepartments: departments.filter(d => d.status === 'inactive').length,
        totalInstructors: departments.reduce((sum, d) => sum + (d.totalInstructors || 0), 0)
      });
    }
  }, [departments, pageState.loading]);

  // Keyboard shortcuts for view and edit functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + V to view selected department (if any)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        if (selectedIds.length === 1) {
          const selectedDepartment = departments.find(d => d.id === selectedIds[0]);
          if (selectedDepartment) {
            handleView(selectedDepartment);
          }
        }
      }
      
      // Ctrl/Cmd + E to edit selected department (if any)
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        if (selectedIds.length === 1) {
          const selectedDepartment = departments.find(d => d.id === selectedIds[0]);
          if (selectedDepartment) {
            handleEdit(selectedDepartment);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, departments]);

  // Add refresh function with proper error handling, retry logic, and validation
  const refreshDepartments = async () => {
    try {
      setPageState(prev => ({ 
        ...prev, 
        loading: true, // Activate main loading state to show skeleton
        isRefreshing: true, 
        error: null,
        operationInProgress: { type: 'refresh', retryCount: 0 }
      }));

      // Fetch departments and instructors in parallel
      const [departmentsResponse, instructorsResponse] = await Promise.all([
        retryOperation(async () => {
          const res = await fetch('/api/departments');
          if (!res.ok) {
            throw new Error(`Failed to refresh departments: ${res.statusText}`);
          }
          return res;
        }),
        retryOperation(async () => {
          const res = await fetch('/api/instructors');
          if (!res.ok) {
            throw new Error(`Failed to refresh instructors: ${res.statusText}`);
          }
          return res;
        })
      ]);

      const [departmentsData, instructorsData] = await Promise.all([
        departmentsResponse.json(),
        instructorsResponse.json()
      ]);
      
              console.log('Instructors data received (refresh):', instructorsData);
        console.log('Sample instructor raw data (refresh):', instructorsData[0]);
      
      if (departmentsData.error) {
        throw new Error(departmentsData.error);
      }

      if (!departmentsData.data || !validateDepartments(departmentsData.data)) {
        throw new Error('Invalid department data received from server');
      }

      // Transform instructors data to match the expected format
      const transformedInstructors = (Array.isArray(instructorsData) ? instructorsData : []).map((instructor: any) => {
        // The API now returns the correct format, but let's ensure compatibility
        if (instructor.name) {
          // Already in correct format
          return {
            id: instructor.id,
            name: instructor.name
          };
        } else {
          // Fallback for old format
          const fullName = [
            instructor.firstName,
            instructor.middleName,
            instructor.lastName
          ].filter(Boolean).join(' ').trim();
          
          return {
            id: instructor.instructorId?.toString() || instructor.id,
            name: fullName
          };
        }
      });

      setDepartments(departmentsData.data);
      setInstructors(transformedInstructors);
      console.log('Transformed instructors (refresh):', transformedInstructors);
      
      toast.success('Data refreshed successfully', {
        description: `${departmentsData.data.length} departments loaded`,
        duration: 3000,
      });
      setLastActionTime("Just now");
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'refresh data');
      setPageState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false,
        isRefreshing: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
      toast.error(errorMessage);
    } finally {
      setPageState(prev => ({ 
        ...prev, 
        loading: false,
        isRefreshing: false,
        operationInProgress: { type: null, retryCount: 0 }
      }));
    }
  };

  // Helper function for delete tooltip
  const getDeleteTooltip = (item: Department) => {
    if (item.status === "inactive") return "Department is already inactive";
    return undefined;
  };

  // Helper function for edit tooltip
  const getEditTooltip = (item: Department) => {
    if (item.status === "active") return "Warning: Editing active department may affect ongoing operations";
    if (item.courseOfferings?.length > 0) return "Warning: Department has courses - changes may affect course assignments";
    if (item.totalInstructors > 0) return "Warning: Department has instructors - changes may affect instructor assignments";
    return "Edit department details";
  };

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

  // Handle reactivate department
  const handleReactivate = async (department: Department) => {
    if (department.status === "active") {
      toast.info("Department is already active");
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
        const res = await fetch(`/api/departments/${department.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'active'
          }),
        });
        if (!res.ok) {
          throw new Error(`Failed to reactivate department: ${res.statusText}`);
        }
        return res;
      });

      const data: ApiResponse<{ success: boolean }> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the department status in the local state
      setDepartments(prev => prev.map(d => 
        d.id === department.id 
          ? { ...d, status: 'active' as const }
          : d
      ));
      
      toast.success(`${department.name} has been reactivated successfully`);
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'reactivate department');
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

  // Update confirmDelete to set status to inactive instead of deleting
  const confirmDelete = async () => {
    const departmentToDelete = dialogState.departmentToDelete;
    if (!departmentToDelete) {
      toast.error('No department selected for deactivation');
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
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'inactive'
          }),
        });
        if (!res.ok) {
          throw new Error(`Failed to deactivate department: ${res.statusText}`);
        }
        return res;
      });

      const data: ApiResponse<{ success: boolean }> = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the department status in the local state
      setDepartments(prev => prev.map(d => 
        d.id === departmentToDelete.id 
          ? { ...d, status: 'inactive' as const }
          : d
      ));
      
      toast.success('Department deactivated successfully');
      setDialogState(prev => ({ 
        ...prev, 
        deleteDialogOpen: false,
        departmentToDelete: null 
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'deactivate department');
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
    try {
      // Set the department to view
      setViewDepartment(department);
      
      // Open the view dialog
      setDialogState(prev => ({ ...prev, viewDialogOpen: true }));
      
      // Log the view action for analytics (optional)
      console.log(`Viewing department: ${department.name} (${department.code})`);
      
      // Show a subtle toast notification
      toast.success(`Viewing ${department.name}`, {
        description: `Department code: ${department.code}`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error opening view dialog:', error);
      toast.error('Failed to open department view');
    }
  };

  const handleEdit = (department: Department) => {
    try {
      console.log('handleEdit called with department:', department);

      
      // Set the department to edit
      setModalDepartment(department);
      console.log('modalDepartment set to:', department);
      
      // Open the edit dialog
      setModalOpen(true);
      console.log('modalOpen set to true');
      
      // Log the edit action for analytics (optional)
      console.log(`Editing department: ${department.name} (${department.code})`);
      
      // Show appropriate notifications based on department state
      if (department.status === "active") {
        toast.warning(`Editing Active Department: ${department.name}`, {
          description: "This department is currently active. Changes may affect ongoing operations.",
          duration: 4000,
        });
      } else if (department.courseOfferings?.length > 0) {
        toast.warning(`Editing Department with Courses: ${department.name}`, {
          description: `This department has ${department.courseOfferings.length} course(s). Changes may affect course assignments.`,
          duration: 4000,
        });
      } else if (department.totalInstructors > 0) {
        toast.warning(`Editing Department with Instructors: ${department.name}`, {
          description: `This department has ${department.totalInstructors} instructor(s). Changes may affect instructor assignments.`,
          duration: 4000,
        });
      } else {
        toast.success(`Editing ${department.name}`, {
          description: `Department code: ${department.code}`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error opening edit dialog:', error);
      toast.error('Failed to open department editor');
    }
  };



  // Helper to get selected departments
  const selectedDepartments = departments.filter(d => selectedIds.includes(d.id));

  // Handler for quick export
  const handleExportSelectedDepartments = async (selected: Department[]) => {
    if (selected.length === 0) {
      toast.error("No departments selected for export");
      return;
    }

    try {
      setPageState(prev => ({ ...prev, isExporting: true }));
      const rows = buildDepartmentExportRows(selected);
      await exportDepartments('excel', rows, `selected-departments-${new Date().toISOString().slice(0,10)}`);
      toast.success(`${selected.length} departments exported successfully`);
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPageState(prev => ({ ...prev, isExporting: false }));
    }
  };

  // Handler for enhanced bulk actions
  const handleOpenBulkActionsDialog = () => {
    setSelectedDepartmentsForBulkAction(selectedDepartments);
    setBulkActionsDialogOpen(true);
  };

  // Handler for dialog action complete
  const handleBulkActionComplete = (actionType: string, results: any) => {
    toast.success(`Bulk action '${actionType}' completed.`);
    setBulkActionsDialogOpen(false);
    setSelectedDepartmentsForBulkAction([]);
  };

  // Handler for dialog cancel
  const handleBulkActionCancel = () => {
    setBulkActionsDialogOpen(false);
    setSelectedDepartmentsForBulkAction([]);
  };

  // Import functionality
  const handleImportDepartments = async (data: any[]) => {
    try {
      const response = await fetch('/api/departments/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: data,
          options: {
            skipDuplicates: true,
            updateExisting: false,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh the departments list after successful import
      await refreshDepartments();
      
      return {
        success: result.results.success,
        failed: result.results.failed,
        errors: result.results.errors || []
      };
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  // Column visibility handlers
  const handleColumnToggle = (columnAccessor: string, checked: boolean) => {
    if (checked) {
      setVisibleColumns(prev => [...prev, columnAccessor]);
    } else {
      setVisibleColumns(prev => prev.filter(col => col !== columnAccessor));
    }
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEPARTMENT_COLUMNS.map(c => c.accessor));
    toast.success('Column visibility reset to default');
  };

  // Debug logging
  console.log('Page State:', {
    loading: pageState.loading,
    error: pageState.error,
    departmentsCount: departments.length,
    instructorsCount: instructors.length
  });

  // Show PageSkeleton when loading
  if (pageState.loading) {
    console.log('Showing PageSkeleton - page is loading');
    return <PageSkeleton />;
  }

  // Show error state if there's an error
  if (pageState.error) {
    console.log('Showing error state:', pageState.error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
            <p className="text-red-600">{pageState.error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reactivate selected logic
  const confirmBulkReactivate = async () => {
    setPageState(prev => ({ ...prev, loading: true }));
    try {
      const inactiveDepartments = selectedDepartments.filter(d => d.status === "inactive");
      const updatePromises = inactiveDepartments.map(async (dept) => {
        const response = await fetch(`/api/departments/${dept.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });
        if (!response.ok) throw new Error(`Failed to reactivate department ${dept.id}`);
        return response.json();
      });
      await Promise.all(updatePromises);
      setDepartments(prev => prev.map(d =>
        selectedIds.includes(d.id) ? { ...d, status: 'active' as const } : d
      ));
      toast.success(`${inactiveDepartments.length} department(s) reactivated successfully.`);
    } catch (err) {
      toast.error("Failed to reactivate departments.");
    }
    setPageState(prev => ({ ...prev, loading: false }));
    setBulkReactivateDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] overflow-x-hidden">
      {/* Main container with responsive padding and spacing */}
      <div className="w-full max-w-none px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
        
        {/* Page Header - Responsive */}
        <div className="w-full">
          <PageHeader
            title="Departments"
            subtitle="Manage academic departments and their details"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Academic Management", href: "/academic-management" },
              { label: "Departments" }
            ]}
          />
        </div>

        {/* Summary Cards - Enhanced responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <SummaryCard
            icon={<Users className="text-blue-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Departments"
            value={departments.length}
            valueClassName="text-blue-900"
            sublabel="Registered departments"
            loading={pageState.loading}
          />
          <SummaryCard
            icon={<UserCheck className="text-blue-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Active Departments"
            value={departments.filter(d => d.status === 'active').length}
            valueClassName="text-blue-900"
            sublabel="Currently active"
            loading={pageState.loading}
          />
          <SummaryCard
            icon={<UserX className="text-blue-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Inactive Departments"
            value={departments.filter(d => d.status === 'inactive').length}
            valueClassName="text-blue-900"
            sublabel="Inactive/archived"
            loading={pageState.loading}
          />
          <SummaryCard
            icon={<UserPlus className="text-blue-700 w-4 h-4 sm:w-5 sm:h-5" />}
            label="Total Instructors"
            value={departments.reduce((sum, d) => sum + (d.totalInstructors || 0), 0)}
            valueClassName="text-blue-900"
            sublabel="Teaching this semester"
            loading={pageState.loading}
          />
        </div>

        {/* Quick Actions Panel - Responsive */}
        <div className="w-full max-w-full pt-2 sm:pt-3 md:pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential tools and shortcuts"
            icon={
              <div className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            }
            actionCards={[
              {
                id: 'add-department',
                label: 'Add Department',
                description: 'Create new department',
                icon: <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />,
                onClick: () => { 
                  setModalDepartment(undefined); 
                  setModalOpen(true); 
                }
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import departments from file',
                icon: <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print department list',
                icon: <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-white" />,
                onClick: handlePrint
              },
              {
                id: 'visible-columns',
                label: 'Visible Columns',
                description: 'Manage table columns',
                icon: <Columns3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />,
                onClick: () => setVisibleColumnsDialogOpen(true)
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload department data',
                icon: pageState.isRefreshing ? (
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: refreshDepartments,
                disabled: pageState.isRefreshing,
                loading: pageState.isRefreshing
              },
              {
                id: 'sort-options',
                label: 'Sort Options',
                description: 'Configure sorting',
                icon: <List className="w-4 h-4 sm:w-5 sm:h-5 text-white" />,
                onClick: () => setSortDialogOpen(true)
              }
            ]}
            lastActionTime={lastActionTime}
            onLastActionTimeChange={setLastActionTime}
            collapsible={true}
            defaultCollapsed={true}
            onCollapseChange={(collapsed) => {
              console.log('Quick Actions Panel collapsed:', collapsed);
            }}
          />
        </div>

        {/* Main Content Area - Enhanced responsive layout */}
        <div className="w-full max-w-full pt-2 sm:pt-3 md:pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header - Responsive padding */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-4 sm:p-5 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Department List</h3>
                    <p className="text-blue-100 text-xs sm:text-sm">Search and filter department information</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Search and Filter Section - Enhanced responsive layout */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center justify-end">
                {/* Search Bar - Responsive width */}
                <div className="relative w-full lg:w-auto lg:min-w-[250px] lg:max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                  />
                </div>
                
                {/* Quick Filter Dropdowns - Responsive layout */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto lg:flex-shrink-0">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[120px] text-gray-500 rounded border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem> 
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={headFilter} onValueChange={setHeadFilter}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px] text-gray-500 rounded border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Head" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Heads</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="unassigned">Not Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Bulk Actions Bar - Responsive */}
            {selectedIds.length > 0 && (
              <div className="mt-2 sm:mt-3 px-3 sm:px-4 md:px-5 lg:px-6 max-w-full">
                <BulkActionsBar
                  selectedCount={selectedIds.length}
                  entityLabel="department"
                  actions={[
                    {
                      key: "bulk-actions",
                      label: "Bulk Actions",
                      icon: <Settings className="w-4 h-4 mr-2" />,
                      onClick: handleOpenBulkActionsDialog,
                      tooltip: "Open enhanced bulk actions dialog for selected departments",
                      variant: "default"
                    },
                    {
                      key: "export",
                      label: "Quick Export",
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: () => handleExportSelectedDepartments(selectedDepartments),
                      tooltip: "Quick export selected departments to CSV"
                    },
                    {
                      key: "delete",
                      label: "Deactivate Selected",
                      icon: pageState.loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: handleBulkDelete,
                      loading: pageState.loading,
                      disabled: pageState.loading,
                      tooltip: "Deactivate selected departments (can be reactivated later)",
                      variant: "destructive",
                      hidden: selectedDepartments.length === 0 || selectedDepartments.every(d => d.status === "inactive")
                    },
                    {
                      key: "reactivate",
                      label: "Reactivate Selected",
                      icon: pageState.loading ? <Loader2 className="h-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />,
                      onClick: () => setBulkReactivateDialogOpen(true),
                      loading: pageState.loading,
                      disabled: pageState.loading,
                      tooltip: "Reactivate selected inactive departments",
                      variant: "default",
                      hidden: selectedDepartments.length === 0 || selectedDepartments.every(d => d.status === "active")
                    }
                  ]}
                  onClear={() => setSelectedIds([])}
                />
              </div>
            )}
            
            {/* Global Empty State - when no departments exist at all */}
            {!pageState.loading && departments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <EmptyState
                  icon={<Users className="w-16 h-16 text-blue-400" />}
                  title="No departments yet"
                  description="Get started by creating your first department. Departments help organize your academic structure and manage courses and instructors."
                  action={
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                        onClick={() => { 
                          setModalDepartment(undefined); 
                          setModalOpen(true); 
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Department
                      </Button>
                      <Button
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                        onClick={() => setImportDialogOpen(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Departments
                      </Button>
                    </div>
                  }
                />
              </div>
            ) : (
              <>
                {/* Table layout for large screens - Enhanced responsive */}
                <div className="hidden xl:block">
                  <div className="px-3 sm:px-4 md:px-5 lg:px-6 pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-5 md:pb-6">
                    {!pageState.loading && filteredDepartments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <EmptyState
                      icon={<Users className="w-12 h-12 text-blue-400" />}
                      title="No departments found"
                      description="No departments match your current search criteria or filters. Try adjusting your search terms or clearing filters to see all departments."
                      action={
                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("all");
                              setHeadFilter("all");
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Clear Filters
                          </Button>
                          <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            onClick={() => { 
                              setModalDepartment(undefined); 
                              setModalOpen(true); 
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Department
                          </Button>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white/70 shadow-none relative">
                    <TableList
                      columns={columns}
                      data={paginatedDepartments}
                      loading={pageState.loading}
                      selectedIds={selectedIds}
                      emptyMessage={null}
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
                        if (["name", "code", "headOfDepartment"].includes(columnAccessor)) {
                          setEditingCell({ rowId: item.id, columnAccessor });
                        }
                      }}
                      onCellChange={async (rowId, columnAccessor, value) => {
                        setEditingCell(null);
                        // Handle cell change logic here
                      }}
                      sortState={{ field: sortState.field, order: sortState.order }}
                      onSort={handleSort}
                      className="border-0 shadow-none max-w-full"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Medium screen table layout */}
            <div className="hidden lg:block xl:hidden">
              <div className="px-3 sm:px-4 md:px-5 lg:px-6 pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-5 md:pb-6">
                {!pageState.loading && filteredDepartments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <EmptyState
                      icon={<Users className="w-12 h-12 text-blue-400" />}
                      title="No departments found"
                      description="No departments match your current search criteria or filters. Try adjusting your search terms or clearing filters to see all departments."
                      action={
                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("all");
                              setHeadFilter("all");
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Clear Filters
                          </Button>
                          <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            onClick={() => { 
                              setModalDepartment(undefined); 
                              setModalOpen(true); 
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Department
                          </Button>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white/70 shadow-none relative">
                    <TableList
                      columns={columns.filter(col => !['description', 'logo'].includes(col.accessor))}
                      data={paginatedDepartments}
                      loading={pageState.loading}
                      selectedIds={selectedIds}
                      emptyMessage={null}
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
                        if (["name", "code", "headOfDepartment"].includes(columnAccessor)) {
                          setEditingCell({ rowId: item.id, columnAccessor });
                        }
                      }}
                      onCellChange={async (rowId, columnAccessor, value) => {
                        setEditingCell(null);
                      }}
                      sortState={{ field: sortState.field, order: sortState.order }}
                      onSort={handleSort}
                      className="border-0 shadow-none max-w-full"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Card layout for small to medium screens - Enhanced responsive */}
            <div className="block lg:hidden p-2 sm:p-3 max-w-full">
              <div className="px-2 sm:px-3 md:px-4 pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-5 md:pb-6">
                {!pageState.loading && filteredDepartments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4">
                    <EmptyState
                      icon={<Users className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400" />}
                      title="No departments found"
                      description="No departments match your current search criteria or filters. Try adjusting your search terms or clearing filters to see all departments."
                      action={
                        <div className="flex flex-col gap-3 w-full max-w-sm">
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-sm"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("all");
                              setHeadFilter("all");
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Clear Filters
                          </Button>
                          <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm"
                            onClick={() => { 
                              setModalDepartment(undefined); 
                              setModalOpen(true); 
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Department
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm"
                            onClick={refreshDepartments}
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
                    items={paginatedDepartments}
                    selectedIds={selectedIds}
                    onSelect={handleSelectRow}
                    onView={(item) => {
                      setViewDepartment(item);
                      setDialogState(prev => ({ ...prev, viewDialogOpen: true }));
                    }}
                    onEdit={(item) => handleEdit(item)}
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
                    disabled={(item) => false} // Admin can edit all departments
                    deleteTooltip={(item) => item.status === "inactive" ? "Department is already inactive" : undefined}
                    isLoading={pageState.loading}
                  />
                )}
              </div>
            </div>
            
            {/* Pagination - Responsive */}
            <div className="px-3 sm:px-4 md:px-5 lg:px-6 pb-4 sm:pb-5 md:pb-6">
              <TablePagination
                page={currentPage}
                pageSize={itemsPerPage}
                totalItems={filteredDepartments.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                pageSizeOptions={[10, 25, 50, 100]}
                loading={pageState.loading}
              />
            </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Dialogs */}
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
          `Are you sure you want to deactivate the department \"${dialogState.departmentToDelete.name}\"? This action can be reversed by reactivating the department.` :
          'Are you sure you want to deactivate this department? This action can be reversed by reactivating the department.'}
      />

      <DepartmentForm
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setModalDepartment(undefined); // Reset department data when dialog closes
          }
        }}
        initialData={modalDepartment}
        instructors={instructors}
        onSuccess={async () => {
          setModalOpen(false);
          setModalDepartment(undefined);
          await refreshDepartments();
        }}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={(open) => setExportDialogOpen(open)}
        onExport={async (format, _options) => {
          try {
            await exportDepartments(format);
            setLastActionTime('Just now');
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Export failed');
          }
        }}
        dataCount={filteredDepartments.length}
        entityType="department"
      />

      <SortDialog
        open={sortDialogOpen}
        onOpenChange={(open) => setSortDialogOpen(open)}
        sortOptions={departmentSortFieldOptions}
        currentSort={{ field: sortField, order: sortOrder }}
        onSortChange={(field: string, order: 'asc' | 'desc') => {
          setSortField(field as SortFieldKey);
          setSortOrder(order as SortOrder);
          setSortFields([{ field: field as SortFieldKey, order: order as SortOrder }]);
        }}
        title="Sort Departments"
        description="Sort departments by different fields. Choose the field and order to organize your list."
        entityType="departments"
      />

      <ViewDialog
        open={dialogState.viewDialogOpen}
        onOpenChange={(open) => {
          setDialogState(prev => ({ ...prev, viewDialogOpen: open }));
          if (!open) setViewDepartment(undefined);
        }}
        title={viewDepartment?.name || ''}
        subtitle={viewDepartment?.code}
        status={viewDepartment ? {
          value: viewDepartment.status,
          variant: viewDepartment.status === "active" ? "success" : "destructive"
        } : undefined}
        logo={viewDepartment?.logo}
        sections={[
          {
            title: "Department Information",
            fields: [
              { label: 'Department Code', value: viewDepartment?.code || 'N/A', type: 'text' },
              { label: 'Status', value: viewDepartment?.status || 'N/A', type: 'badge', badgeVariant: viewDepartment?.status === 'active' ? 'success' : 'destructive' },
              { label: 'Total Courses', value: viewDepartment?.courseOfferings?.length || 0, type: 'number' },
              { label: 'Total Instructors', value: viewDepartment?.totalInstructors || 0, type: 'number' },
              { label: 'Description', value: viewDepartment?.description || 'No description available', type: 'text' }
            ]
          },

          {
            title: "Course Offerings",
            fields: viewDepartment?.courseOfferings?.map(course => ({
              label: `${course.name} (${course.code})`,
              value: `${course.totalStudents || 0} students, ${course.totalSections || 0} sections`,
              type: 'course-with-status' as const,
              badgeVariant: course.status === 'active' ? 'success' : 'destructive',
              description: course.description || 'No description available'
            })) || [
              { label: 'No Courses', value: 'No courses offered by this department', type: 'text' }
            ]
          }
        ]}
        departmentHead={viewDepartment?.headOfDepartmentDetails ? {
          name: viewDepartment.headOfDepartmentDetails.fullName,
          position: "Department Head",
          department: viewDepartment.name,
          email: viewDepartment.headOfDepartmentDetails.email,
          phone: viewDepartment.headOfDepartmentDetails.phoneNumber,
          officeLocation: viewDepartment.headOfDepartmentDetails.officeLocation,
          officeHours: viewDepartment.headOfDepartmentDetails.officeHours,
        } : (viewDepartment?.headOfDepartment && viewDepartment.headOfDepartment !== 'Not Assigned' ? {
          name: viewDepartment.headOfDepartment,
          position: "Department Head",
          department: viewDepartment.name
        } : undefined)}
        description={viewDepartment?.description}
        tooltipText="View comprehensive department information including settings, courses, and contact details"
      />

      <BulkActionsDialog
        open={bulkActionsDialogOpen}
        onOpenChange={setBulkActionsDialogOpen}
        selectedItems={selectedDepartmentsForBulkAction}
        entityType="department"
        entityLabel="department"
        availableActions={[
          {
            id: 'status-update',
            label: 'Update Status',
            description: 'Update status of selected departments',
            icon: <Settings className="w-4 h-4" />,
            tabId: 'status'
          },
          {
            id: 'notification',
            label: 'Send Notification',
            description: 'Send notifications to selected departments',
            icon: <Bell className="w-4 h-4" />,
            tabId: 'notifications'
          },
          {
            id: 'export',
            label: 'Export Data',
            description: 'Export selected departments data',
            icon: <Download className="w-4 h-4" />,
            tabId: 'export'
          }
        ]}
        onActionComplete={handleBulkActionComplete}
        onCancel={handleBulkActionCancel}
        onProcessAction={async (actionType: string, config: any) => {
          try {
            switch (actionType) {
              case 'status_change':
                const targetStatus = config.status as 'active' | 'inactive';
                const updatePromises = selectedDepartmentsForBulkAction.map(async (dept) => {
                  const response = await fetch(`/api/departments/${dept.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: targetStatus }),
                  });
                  if (!response.ok) throw new Error(`Failed to update department ${dept.id}`);
                  return response.json();
                });
                
                await Promise.all(updatePromises);
                
                // Update local state
                setDepartments(prev => prev.map(d => {
                  if (selectedDepartmentsForBulkAction.some(selected => selected.id === d.id)) {
                    return { ...d, status: targetStatus };
                  }
                  return d;
                }));
                
                return { 
                  success: true, 
                  processed: selectedDepartmentsForBulkAction.length,
                  message: `${selectedDepartmentsForBulkAction.length} departments updated to ${targetStatus}`
                };
                
              case 'assign_instructors':
                const instructorIds = config.instructorIds || [];
                const assignResponse = await fetch('/api/departments/bulk/assign-instructors', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    departmentIds: selectedDepartmentsForBulkAction.map(d => d.id),
                    instructorIds 
                  }),
                });
                
                if (!assignResponse.ok) {
                  throw new Error('Failed to assign instructors');
                }
                
                return { 
                  success: true, 
                  processed: selectedDepartmentsForBulkAction.length,
                  message: `Instructors assigned to ${selectedDepartmentsForBulkAction.length} departments`
                };
                
              case 'bulk_delete':
                const deletePromises = selectedDepartmentsForBulkAction.map(async (dept) => {
                  const response = await fetch(`/api/departments/${dept.id}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) throw new Error(`Failed to delete department ${dept.id}`);
                  return response.json();
                });
                
                await Promise.all(deletePromises);
                
                // Remove from local state
                const deletedIds = selectedDepartmentsForBulkAction.map(d => d.id);
                setDepartments(prev => prev.filter(d => !deletedIds.includes(d.id)));
                setSelectedIds(prev => prev.filter(id => !deletedIds.includes(id)));
                
                return { 
                  success: true, 
                  processed: selectedDepartmentsForBulkAction.length,
                  message: `${selectedDepartmentsForBulkAction.length} departments deleted`
                };
                
              case 'export':
                const exportFormat = config.format || 'excel';
                const exportData = selectedDepartmentsForBulkAction.map(dept => ({
                  'Department Name': dept.name,
                  'Code': dept.code,
                  'Head of Department': dept.headOfDepartment || 'Not Assigned',
                  'Status': dept.status,
                  'Total Instructors': dept.totalInstructors || 0,
                  'Total Courses': dept.courseOfferings?.length || 0,
                  'Description': dept.description || ''
                }));

                if (exportFormat === 'excel') {
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.json_to_sheet(exportData);
                  XLSX.utils.book_append_sheet(wb, ws, "Bulk Export");
                  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                  XLSX.writeFile(wb, `bulk-departments-${timestamp}.xlsx`);
                }
                
                return { 
                  success: true, 
                  processed: selectedDepartmentsForBulkAction.length,
                  message: `${selectedDepartmentsForBulkAction.length} departments exported`
                };
                
              default:
                throw new Error(`Unknown action type: ${actionType}`);
            }
          } catch (error) {
            console.error('Bulk action processing failed:', error);
            return { 
              success: false, 
              processed: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }}
        getItemDisplayName={(item: Department) => item.name}
        getItemStatus={(item: Department) => item.status}
        getItemId={(item: Department) => item.id}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportDepartments}
        entityName="Departments"
        templateUrl="/api/departments/template"
        acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
        maxFileSize={5}
      />

      {/* Visible Columns Dialog */}
      <VisibleColumnsDialog
        open={visibleColumnsDialogOpen}
        onOpenChange={setVisibleColumnsDialogOpen}
        columns={COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onColumnToggle={handleColumnToggle}
        onReset={handleResetColumns}
        title="Manage Department Columns"
        description="Choose which columns to display in the department table"
        searchPlaceholder="Search department columns..."
        enableManualSelection={true}
        onManualSelectionChange={(state) => {
          console.log('Manual selection state:', state);
          // You can add additional logic here, like saving to localStorage
        }}
      />

      {/* Toast Notification Region */}
      <div role="region" aria-live="polite" className="sr-only" id="departments-toast-region" />

      {/* Bulk Deactivate Dialog */}
      <ConfirmDeleteDialog
        open={bulkDeactivateDialogOpen}
        onOpenChange={setBulkDeactivateDialogOpen}
        itemName={selectedIds.length > 1 ? `${selectedIds.length} departments` : 'department'}
        onDelete={confirmBulkDeactivate}
        onCancel={() => setBulkDeactivateDialogOpen(false)}
        canDelete={true}
        loading={pageState.loading}
        description={`Are you sure you want to deactivate ${selectedIds.length} selected department(s)? This action can be reversed by reactivating the departments.`}
      />

      <ConfirmDeleteDialog
        open={bulkReactivateDialogOpen}
        onOpenChange={setBulkReactivateDialogOpen}
        itemName={selectedDepartments.filter(d => d.status === "inactive").length > 1
          ? `${selectedDepartments.filter(d => d.status === "inactive").length} departments`
          : 'department'}
        onDelete={confirmBulkReactivate}
        onCancel={() => setBulkReactivateDialogOpen(false)}
        canDelete={true}
        loading={pageState.loading}
        description={`Are you sure you want to reactivate ${selectedDepartments.filter(d => d.status === "inactive").length} selected inactive department(s)?`}
        confirmLabel="Reactivate"
      />


    </div>
  );
}
