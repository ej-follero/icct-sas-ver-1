"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import CourseForm from '@/components/forms/CourseForm';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import Fuse from "fuse.js";
import React from "react";
import { Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, UserCheck, UserX, Users, UserPlus, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, Hash, Tag, Layers, FileText, Clock, Info, UserCheck as UserCheckIcon, Archive } from "lucide-react";
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
import { safeHighlight } from "@/lib/sanitizer";
import { Card, CardHeader } from "@/components/ui/card";
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import BulkActionsDialog from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { SummaryCardSkeleton, PageSkeleton } from '@/components/reusable/Skeleton';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { Pagination } from "@/components/Pagination";

import { subjectsApi } from '@/services/api/subjects';
import { useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CourseStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | "PENDING_REVIEW";

interface Course {
  id: string;
  name: string;
  code: string;
  department: string; // Now contains department ID
  departmentName?: string; // Department name for display
  departmentCode?: string;
  units: number;
  description?: string;
  status: CourseStatus;
  totalStudents: number;
  totalInstructors: number;
  createdAt: string;
  updatedAt: string;
  courseType: "MANDATORY" | "ELECTIVE";
  major: string;
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

const courseSortFieldOptions = [
  { value: 'name', label: 'Course Name' },
  { value: 'code', label: 'Course Code' },
  { value: 'department', label: 'Department' },
  { value: 'units', label: 'Total Units' },
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
  { key: 'name', label: 'Course Name', accessor: 'name', className: 'text-blue-900', sortable: true },
  { key: 'code', label: 'Course Code', accessor: 'code', className: 'text-blue-900', sortable: true },
  { key: 'department', label: 'Department', accessor: 'department', className: 'text-blue-900', sortable: true },
  { key: 'units', label: 'Total Units', accessor: 'units', className: 'text-center text-blue-900', sortable: true },
  { key: 'courseType', label: 'Course Type', accessor: 'courseType', className: 'text-center text-blue-900', sortable: true },
  { key: 'major', label: 'Major', accessor: 'major', className: 'text-blue-900', sortable: true },
  { key: 'status', label: 'Status', accessor: 'status', className: 'text-center', sortable: true },
];

// Define exportable columns for dialog compatibility
const exportableColumns: { accessor: string; label: string }[] = courseColumns.map((col) => ({ accessor: col.key, label: col.label }));
// For export dialogs, use the old { key, label } version
const exportableColumnsForExport: { key: string; label: string }[] = courseColumns.map((col) => ({ key: col.key, label: col.label }));

// Define column options for visible columns dialog
const COLUMN_OPTIONS: ColumnOption[] = courseColumns.map(col => ({
  accessor: typeof col.accessor === 'string' ? col.accessor : col.key,
  header: col.label,
  description: undefined,
  category: 'Course Info',
  required: col.key === 'name' || col.key === 'code', // Always show name and code
}));

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  // Move visibleColumns state here, before any usage
  const [visibleColumns, setVisibleColumns] = useState<string[]>(courseColumns.map(col => col.key));
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [courseTypeFilter, setCourseTypeFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [selectedCoursesForBulkAction, setSelectedCoursesForBulkAction] = useState<Course[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  // Add import dialog state if not present
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  // Add state for subjects per course and loading
  const [courseSubjects, setCourseSubjects] = useState<Record<string, any[]>>({});
  const [subjectsLoading, setSubjectsLoading] = useState<Record<string, boolean>>({});
  // Add state for tab view, sections, and students per course
  const [expandedTabs, setExpandedTabs] = useState<Record<string, 'section' | 'students' | 'subjects'>>({});
  const [courseSections, setCourseSections] = useState<Record<string, any[]>>({});
  const [sectionsLoading, setSectionsLoading] = useState<Record<string, boolean>>({});
  const [courseStudents, setCourseStudents] = useState<Record<string, any[]>>({});
  const [studentsLoading, setStudentsLoading] = useState<Record<string, boolean>>({});
  const [departmentFilter, setDepartmentFilter] = useState('all');

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

    // Apply course type filter
    if (courseTypeFilter !== "all") {
      filtered = filtered.filter(course => course.courseType === courseTypeFilter);
    }

    // Apply department filter (by code)
    if (departmentFilter !== "all") {
      filtered = filtered.filter(course => course.departmentCode === departmentFilter);
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
  }, [fuzzyResults, columnFilters, statusFilter, courseTypeFilter, departmentFilter, sortFields]);

  // Add pagination
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCourses.slice(start, end);
  }, [filteredCourses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

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

  // Handler for toggling column visibility
  const handleColumnToggle = (columnAccessor: string, checked: boolean) => {
    setVisibleColumns(prev => {
      if (checked) {
        return prev.includes(columnAccessor) ? prev : [...prev, columnAccessor];
      } else {
        // Don't allow hiding required columns
        if (COLUMN_OPTIONS.find(col => col.accessor === columnAccessor)?.required) return prev;
        return prev.filter(col => col !== columnAccessor);
      }
    });
  };
  // Handler for resetting columns to default
  const handleResetColumns = () => {
    setVisibleColumns(courseColumns.map(col => col.key));
    toast.success('Column visibility reset to default');
  };

  // Move fetchSections and fetchStudents above expandedContent
  const fetchSections = async (courseId: string) => {
    setSectionsLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const res = await fetch('/api/sections');
      const data = await res.json();
      setCourseSections(prev => ({ ...prev, [courseId]: data.filter((s: any) => String(s.courseId) === String(courseId)) }));
    } catch (e) {
      toast.error('Failed to load sections for this course');
      setCourseSections(prev => ({ ...prev, [courseId]: [] }));
    } finally {
      setSectionsLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };
  const fetchStudents = async (courseId: string) => {
    setStudentsLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      // Student attendance API was removed - using alternative approach
      setCourseStudents(prev => ({ ...prev, [courseId]: [] }));
    } catch (e) {
      toast.error('Failed to load students for this course');
      setCourseStudents(prev => ({ ...prev, [courseId]: [] }));
    } finally {
      setStudentsLoading(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Table columns (filtered by visibleColumns)
  const columns: TableListColumn<Course>[] = [
    {
      header: '',
      accessor: 'expander',
      className: 'w-10 text-center align-middle px-1 py-1',
      render: (item: Course) => (
        <button
          onClick={() => onToggleExpand(item.id)}
          className="px-2 py-1 rounded-full hover:bg-gray-200 text-center"
          aria-label={expandedRowIds.includes(item.id) ? 'Collapse row' : 'Expand row'}
        >
          {expandedRowIds.includes(item.id) ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
        </button>
      ),
      expandedContent: (item: Course) => {
        const tab = expandedTabs[item.id] || 'subjects';
        let dataRows = [];
        let headers = [];
        if (tab === 'section') {
          headers = ["Section Name", "Capacity", "Status", "Year Level"];
          dataRows = sectionsLoading[item.id]
            ? [[<TableCell key="loading" colSpan={4}>Loading sections...</TableCell>]]
            : (courseSections[item.id]?.length
                ? courseSections[item.id].map((section) => [
                    <TableCell key="name">{section.sectionName}</TableCell>,
                    <TableCell key="capacity">{section.sectionCapacity}</TableCell>,
                    <TableCell key="status">{section.sectionStatus}</TableCell>,
                    <TableCell key="year">{section.yearLevel}</TableCell>,
                  ])
                : [[<TableCell key="empty" colSpan={4}>No sections found for this course.</TableCell>]]
              );
        } else if (tab === 'students') {
          headers = ["Student Name", "ID Number", "Year Level", "Status", "Email"];
          dataRows = studentsLoading[item.id]
            ? [[<TableCell key="loading" colSpan={5}>Loading students...</TableCell>]]
            : (courseStudents[item.id]?.length
                ? courseStudents[item.id].map((student) => [
                    <TableCell key="name">{student.studentName || `${student.firstName} ${student.lastName}`}</TableCell>,
                    <TableCell key="id">{student.studentId || student.studentIdNumber}</TableCell>,
                    <TableCell key="year">{student.yearLevel}</TableCell>,
                    <TableCell key="status">{student.status}</TableCell>,
                    <TableCell key="email">{student.email}</TableCell>,
                  ])
                : [[<TableCell key="empty" colSpan={5}>No students found for this course.</TableCell>]]
              );
        } else {
          headers = ["Code", "Name", "Units", "Type", "Status"];
          dataRows = subjectsLoading[item.id]
            ? [[<TableCell key="loading" colSpan={5}>Loading subjects...</TableCell>]]
            : (courseSubjects[item.id]?.length
                ? courseSubjects[item.id].map((subject: any) => [
                    <TableCell key="code" className="font-mono text-xs w-20">{subject.code || subject.subjectCode}</TableCell>,
                    <TableCell key="name" className="w-48">{subject.name || subject.subjectName}</TableCell>,
                    <TableCell key="units" className="w-12 text-center">{subject.units || subject.creditUnits}</TableCell>,
                    <TableCell key="type" className="w-20 text-center capitalize">{subject.type || subject.subjectType}</TableCell>,
                    <TableCell key="status" className="w-16 text-center capitalize">{subject.status || subject.subjectStatus}</TableCell>,
                  ])
                : [[<TableCell key="empty" colSpan={5}>No subjects found for this course.</TableCell>]]
              );
        }
        return (
          <td colSpan={columns.length} className="p-0">
            <div className="bg-blue-50 p-4">
              {/* Tabs and Title */}
              <div className="flex gap-2 justify-end mb-4">
                <button
                  className={`px-5 py-2 rounded-t-lg font-semibold transition-all duration-150
                    ${tab === 'section'
                      ? 'bg-white shadow text-blue-900 border-b-2 border-blue-600'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  onClick={() => setExpandedTabs(prev => ({ ...prev, [item.id]: 'section' }))}
                >Section</button>
                <button
                  className={`px-5 py-2 rounded-t-lg font-semibold transition-all duration-150
                    ${tab === 'students'
                      ? 'bg-white shadow text-blue-900 border-b-2 border-blue-600'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  onClick={() => setExpandedTabs(prev => ({ ...prev, [item.id]: 'students' }))}
                >Students</button>
                <button
                  className={`px-5 py-2 rounded-t-lg font-semibold transition-all duration-150
                    ${tab === 'subjects'
                      ? 'bg-white shadow text-blue-900 border-b-2 border-blue-600'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                  onClick={() => setExpandedTabs(prev => ({ ...prev, [item.id]: 'subjects' }))}
                >Subjects</button>
              </div>
              {/* Table */}
              <Table className="bg-white rounded-md">
                <TableHeader>
                  <TableRow>
                    {headers.map((header, idx) => (
                      <TableHead key={idx} className="bg-blue-100 text-blue-900 font-semibold text-center">{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="[&>tr>td]:text-blue-900 text-center">
                  {dataRows.map((cells, idx) => (
                    <TableRow key={idx}>
                      {cells.map((cell, cidx) => {
                        // If cell is a TableCell, clone and add text-center
                        if (cell && cell.type && cell.type.displayName === 'TableCell') {
                          return React.cloneElement(cell, { className: (cell.props.className || '') + ' text-center' });
                        }
                        // Otherwise, wrap in a centered td
                        return <td key={cidx} className="text-center">{cell}</td>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </td>
        );
      }
    },
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
      className: 'w-12 text-center align-middle',
    },
    ...courseColumns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => {
        if (col.key === 'name') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center align-middle min-w-[120px] max-w-[200px] whitespace-normal font-medium text-blue-900',
            sortable: col.sortable,
            render: (item: Course) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<Course> | undefined;
              const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "name")?.indices;
              return (
                <div 
                  className="text-sm font-medium text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: safeHighlight(item.name, nameMatches ? [...nameMatches] : undefined) }}
                />
              );
            }
          };
        }
        if (col.key === 'code') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center align-middle min-w-[80px] max-w-[100px] whitespace-nowrap text-blue-900',
            sortable: col.sortable,
            render: (item: Course) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<Course> | undefined;
              const codeMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "code")?.indices;
              return (
                <div 
                  className="text-sm text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: safeHighlight(item.code, codeMatches ? [...codeMatches] : undefined) }}
                />
              );
            }
          };
        }
        if (col.key === 'department') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center align-middle min-w-[120px] max-w-[180px] whitespace-normal text-blue-900',
            sortable: col.sortable,
            render: (item: Course) => (
              <span className="text-sm text-blue-900 text-center">{item.departmentName || 'Not Applicable'}</span>
            )
          };
        }
        if (col.key === 'courseType') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center align-middle min-w-[100px] max-w-[120px] whitespace-normal text-blue-900',
            sortable: col.sortable,
            render: (item: Course) => (
              <Badge variant={item.courseType === "MANDATORY" ? "success" : "secondary"} className="text-center">
                {item.courseType.toUpperCase()}
              </Badge>
            )
          };
        }
        if (col.key === 'major') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center align-middle min-w-[100px] max-w-[150px] whitespace-normal text-blue-900',
            sortable: col.sortable,
            render: (item: Course) => (
              <span className="text-sm text-blue-900 text-center">{item.major ? item.major : 'Not Applicable'}</span>
            )
          };
        }
        if (col.key === 'status') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center align-middle min-w-[80px] max-w-[100px] whitespace-nowrap',
            sortable: col.sortable,
            render: (item: Course) => (
              <Badge variant={item.status === "ACTIVE" ? "success" : item.status === "INACTIVE" ? "destructive" : item.status === "ARCHIVED" ? "secondary" : "warning"} className="text-center">
                {item.status.toUpperCase()}
              </Badge>
            )
          };
        }
        return {
          header: col.label,
          accessor: col.accessor,
          className: 'text-center align-middle min-w-[80px] max-w-[120px] whitespace-normal text-blue-900',
          sortable: col.sortable
        };
      }),
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center align-middle px-1 py-1",
      render: (item: Course) => (
        <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Course"
                  className="hover:bg-blue-50"
                  onClick={() => {
                    setSelectedCourse(item);
                    setViewModalOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                View details
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit Course"
                  className="hover:bg-green-50"
                  onClick={() => {
                    setSelectedCourse(item);
                    setEditModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                Edit
              </TooltipContent>
            </Tooltip>

            {item.status === "ARCHIVED" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Restore Course"
                    className="hover:bg-green-50"
                    onClick={() => handleRestore(item)}
                  >
                    <RotateCcw className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                  Restore course
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Archive Course"
                      className="hover:bg-red-50"
                      onClick={() => {
                        setSelectedCourse(item);
                        setDeleteModalOpen(true);
                      }}
                      disabled={false}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                  {item.status === "ACTIVE"
                    ? "Cannot archive an active course"
                    : item.totalStudents > 0
                    ? "Cannot archive course with enrolled students"
                    : item.totalInstructors > 0
                    ? "Cannot archive course with assigned instructors"
                    : "Archive course"}
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )
    }
  ];

  // Handler for toggling expanded rows (fetch subjects if not loaded)
  const onToggleExpand = async (itemId: string) => {
    setExpandedRowIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
    if (!courseSubjects[itemId]) {
      setSubjectsLoading((prev) => ({ ...prev, [itemId]: true }));
      try {
        const data = await subjectsApi.fetchSubjects({ page: 1, pageSize: 100, courseId: itemId });
        setCourseSubjects((prev) => ({ ...prev, [itemId]: data.subjects }));
      } catch (e) {
        toast.error('Failed to load subjects for this course');
        setCourseSubjects((prev) => ({ ...prev, [itemId]: [] }));
      } finally {
        setSubjectsLoading((prev) => ({ ...prev, [itemId]: false }));
      }
    }
  };

  // Handler for sorting columns
  const handleSort = (field: string) => {
    setSortField((prevField) => {
      const isSameField = prevField === field;
      const newOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder as CourseSortOrder);
      setSortFields([{ field: field as CourseSortField, order: newOrder as CourseSortOrder }]);
      return field as CourseSortField;
    });
  };

  // Export handler
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const selectedCourses = selectedIds.length > 0 
        ? courses.filter(course => selectedIds.includes(course.id))
        : filteredCourses;

      const visibleColumns = courseColumns.filter(col => exportColumns.includes(col.key));

      switch (format) {
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

      toast.success(`Courses exported to ${format.toUpperCase()} successfully.`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export courses. Please try again.");
      throw error; // Re-throw to let ExportDialog handle the error state
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
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'courses-list.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Archive course (soft delete)
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to archive course");
      }

      toast.success("Course archived successfully");
      await fetchCourses(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Bulk archive courses (soft delete)
  const handleBulkDelete = async () => {
    try {
      const response = await fetch("/api/courses/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to archive courses");
      }

      toast.success("Selected courses archived successfully");
      setSelectedIds([]);
      await fetchCourses(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Handler for importing courses
  const handleImportCourses = async (data: any[]) => {
    try {
      const response = await fetch('/api/courses/bulk', {
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
      // Refresh the courses list after successful import
      await fetchCourses(true);
      toast.success('Courses imported successfully');
      return {
        success: result.results?.success,
        failed: result.results?.failed,
        errors: result.results?.errors || []
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to import courses');
      throw error;
    }
  };

  // Handler to restore (reactivate) an archived course
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const handleRestore = async (course: Course) => {
    setRestoringId(course.id);
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // If response is empty or invalid JSON
        data = null;
      }
      if (!res.ok || !data || data.error) {
        toast.error(data?.error || 'Failed to restore course.');
        setRestoringId(null);
        return;
      }
      toast.success('Course restored successfully!');
      fetchCourses();
    } catch (err) {
      toast.error('Failed to restore course.');
    } finally {
      setRestoringId(null);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCourses();
  }, []);

  React.useEffect(() => {
    expandedRowIds.forEach((courseId) => {
      const tab = expandedTabs[courseId] || 'subjects';
      if (tab === 'section' && courseSections[courseId] === undefined && !sectionsLoading[courseId]) {
        fetchSections(courseId);
      }
      if (tab === 'students' && courseStudents[courseId] === undefined && !studentsLoading[courseId]) {
        fetchStudents(courseId);
      }
      // You can add similar logic for 'subjects' if needed
    });
  }, [expandedRowIds, expandedTabs]);

  // Handler for opening the bulk actions dialog
  const handleOpenBulkActionsDialog = () => {
    setSelectedCoursesForBulkAction(selectedCourses);
    setBulkActionsDialogOpen(true);
  };
  // Handler for dialog action complete
  const handleBulkActionComplete = (actionType: string, results: any) => {
    toast.success(`Bulk action '${actionType}' completed.`);
    setBulkActionsDialogOpen(false);
    setSelectedCoursesForBulkAction([]);
    fetchCourses(true);
  };
  // Handler for dialog cancel
  const handleBulkActionCancel = () => {
    setBulkActionsDialogOpen(false);
    setSelectedCoursesForBulkAction([]);
  };
  // Handler for processing bulk actions
  const handleProcessBulkAction = async (actionType: string, config: any) => {
    if (actionType === 'status-update') {
      // Archive or restore selected courses
      const status = config.status?.toUpperCase();
      const updatePromises = selectedCoursesForBulkAction.map(async (course) => {
        const response = await fetch(`/api/courses/${course.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error(`Failed to update course ${course.name}`);
        return response.json();
      });
      await Promise.all(updatePromises);
      return { success: true, processed: selectedCoursesForBulkAction.length };
    }
    if (actionType === 'export') {
      // Export handled in dialog
      return { success: true };
    }
    if (actionType === 'notification') {
      // Simulate notification
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
    return { success: false };
  };

  const handleExportSelectedCourses = (selectedCourses: Course[]) => {
    if (selectedCourses.length === 0) {
      toast.error('No courses selected for export');
      return;
    }
    
    // Simple debounce to prevent rapid clicking
    const now = Date.now();
    if (now - lastExportTime < 2000) { // 2 second debounce
      toast.error('Please wait before exporting again');
      return;
    }
    
    setLastExportTime(now);
    handleExportCSV(selectedCourses, courseColumns);
  };

  const selectedCourses = courses.filter(course => selectedIds.includes(course.id));

  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map(col => col.accessor));
  const [lastExportTime, setLastExportTime] = useState<number>(0);

  // Get unique department codes for filter dropdown
  const departmentOptions = useMemo(() => {
    const codes = courses.map(c => c.departmentCode).filter((code): code is string => typeof code === 'string' && !!code);
    return Array.from(new Set(codes)).sort();
  }, [courses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] overflow-x-hidden">
      <div className="w-full max-w-none px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6">
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
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-4 md:gap-5 lg:gap-6">
          <SummaryCard
            icon={<BookOpen className="text-blue-500 w-5 h-5" />}
            label="Total Courses"
            value={courses.length}
            valueClassName="text-blue-900"
            sublabel="Total number of courses"
          />
          <SummaryCard
            icon={<UserCheck className="text-blue-500 w-5 h-5" />}
            label="Active Courses"
            value={courses.filter(c => c.status === 'ACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Currently active"
          />
          <SummaryCard
            icon={<UserX className="text-blue-500 w-5 h-5" />}
            label="Inactive Courses"
            value={courses.filter(c => c.status === 'INACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Inactive or archived"
          />
          <SummaryCard
            icon={<GraduationCap className="text-blue-500 w-5 h-5" />}
            label="Total Students"
            value={courses.reduce((sum, c) => sum + (c.totalStudents || 0), 0)}
            valueClassName="text-blue-900"
            sublabel="Total enrolled students"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-2 xs:pt-3 sm:pt-4">
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
            <div className="border-b border-gray-200 shadow-sm p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 items-stretch sm:items-center justify-end">
                {/* Search Bar */}
                <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 xs:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-row gap-2 xs:gap-3 w-full sm:w-auto sm:flex-shrink-0">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full xs:w-24 sm:w-28 md:w-32 text-gray-400 rounded border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><RotateCcw className="w-4 h-4" /></span> Active
                        </span>
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><X className="w-4 h-4" /></span> Inactive
                        </span>
                      </SelectItem>
                      <SelectItem value="ARCHIVED">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-500"><Archive className="w-4 h-4" /></span> Archived
                        </span>
                      </SelectItem>
                      <SelectItem value="COMPLETED">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500"><Clock className="w-4 h-4" /></span> Completed
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={courseTypeFilter} onValueChange={setCourseTypeFilter}>
                    <SelectTrigger className="w-full xs:w-24 sm:w-28 md:w-32 text-gray-400 rounded border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Course Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="MANDATORY">Mandatory</SelectItem>
                      <SelectItem value="ELECTIVE">Elective</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full xs:w-28 sm:w-32 md:w-40 text-gray-400 rounded border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                      <SelectValue placeholder="Department Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departmentOptions.map((code) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="mt-2 xs:mt-3 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 max-w-full">
                <BulkActionsBar
                  selectedCount={selectedIds.length}
                  entityLabel="course"
                  actions={[
                    {
                      key: "bulk-actions",
                      label: "Bulk Actions",
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
                      key: "archive",
                      label: "Archive Selected",
                      icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />,
                      onClick: () => setBulkActionsDialogOpen(true),
                      loading: loading,
                      disabled: loading || selectedCourses.every(c => c.status === "ARCHIVED"),
                      tooltip: "Archive selected courses (can be restored later)",
                      variant: "destructive",
                      hidden: selectedCourses.length === 0 || selectedCourses.every(c => c.status === "ARCHIVED")
                    },
                    {
                      key: "restore",
                      label: "Restore Selected",
                      icon: loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />,
                      onClick: () => setBulkActionsDialogOpen(true),
                      loading: loading,
                      disabled: loading || selectedCourses.every(c => c.status !== "ARCHIVED"),
                      tooltip: "Restore selected archived courses",
                      variant: "default",
                      hidden: selectedCourses.length === 0 || selectedCourses.every(c => c.status !== "ARCHIVED")
                    }
                  ]}
                  onClear={() => setSelectedIds([])}
                />
              </div>
            )}
          {/* Table layout for large screens */}
          <div className="hidden lg:block">
            <div className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 pt-4 xs:pt-5 sm:pt-6 pb-4 xs:pb-5 sm:pb-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {/* Loader overlay when refreshing */}
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
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
                      expandedRowIds={expandedRowIds}
                      onToggleExpand={onToggleExpand}
                      sortState={{ field: sortField, order: sortOrder }}
                      onSort={handleSort}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Card layout for small to medium screens */}
          <div className="block lg:hidden p-1 xs:p-2 sm:p-3 max-w-full">
            <div className="px-2 xs:px-3 sm:px-4 pt-4 xs:pt-5 sm:pt-6 pb-4 xs:pb-5 sm:pb-6">
              {!loading && filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 xs:py-8 px-3 xs:px-4">
                  <EmptyState
                    icon={<BookOpen className="w-5 h-5 xs:w-6 xs:h-6 text-blue-400" />}
                    title="No courses found"
                    description="Try adjusting your search criteria or filters to find the courses you're looking for."
                    action={
                      <div className="flex flex-col gap-2 w-full max-w-sm">
                        <Button
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-sm"
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
                  getItemDescription={(item) => item.departmentName}
                  getItemDetails={(item) => [
                    { label: 'Department', value: String(item.departmentName || 'N/A') },
                    { label: 'Units', value: item.units.toString() },
                    { label: 'Type', value: item.courseType },
                    { label: 'Major', value: item.major || 'N/A' },
                    { label: 'Students', value: item.totalStudents.toString() },
                    { label: 'Instructors', value: item.totalInstructors.toString() },
                  ]}
                  disabled={(item) => false}
                  deleteTooltip={(item) => item.status === "ARCHIVED" ? "Course is already archived" : "Archive course"}
                  isLoading={loading}
                />
              )}
            </div>
          </div>
          {/* Pagination */}
          <div className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6">
            <TablePagination
              page={currentPage}
              pageSize={itemsPerPage}
              totalItems={filteredCourses.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setItemsPerPage}
              entityLabel="course"
              pageSizeOptions={[10, 25, 50, 100]}
              loading={loading}
            />
          </div>
          </Card>
        </div>

      {/* Add Course Dialog */}
      <CourseForm
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

        description={selectedCourse ? `Are you sure you want to archive the course "${selectedCourse.name}"?` : undefined}
        affectedItems={5}
        affectedItemType="students"
      />

      <CourseForm
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
        sortOptions={courseSortFieldOptions}
        currentSort={{ field: sortField, order: sortOrder }}
        onSortChange={(field: string, order: 'asc' | 'desc') => {
          setSortField(field as CourseSortField);
          setSortOrder(order as CourseSortOrder);
          setSortFields([{ field: field as SortField, order }]);
        }}
        title="Sort Courses"
        description="Sort courses by different fields. Choose the field and order to organize your list."
        entityType="courses"
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        dataCount={selectedCourses.length}
        entityType="student"
        onExport={async (format, options) => {
          await handleExport(format);
        }}
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
        title={selectedCourse ? `${selectedCourse.name}` : "Course Details"}
        subtitle={selectedCourse?.code}
        status={selectedCourse ? {
          value: selectedCourse.status,
          variant: selectedCourse.status === "ACTIVE" ? "success" : 
                  selectedCourse.status === "INACTIVE" ? "destructive" : 
                  selectedCourse.status === "ARCHIVED" ? "secondary" : "warning"
        } : undefined}
        headerVariant="default"
        sections={selectedCourse ? ([
          {
            title: "Course Information",
            fields: [
              { label: 'Course ID', value: String(selectedCourse.id), icon: <Hash className="w-4 h-4 text-blue-600" /> },
              { label: 'Course Name', value: selectedCourse.name, icon: <BookOpen className="w-4 h-4 text-blue-600" /> },
              { label: 'Course Code', value: selectedCourse.code, icon: <Tag className="w-4 h-4 text-blue-600" /> },
              { label: 'Department', value: selectedCourse.department, icon: <Building2 className="w-4 h-4 text-blue-600" /> },
              { label: 'Department Code', value: selectedCourse.departmentCode || '', icon: <BadgeInfo className="w-4 h-4 text-blue-600" /> },
              { label: 'Units', value: String(selectedCourse.units), icon: <Layers className="w-4 h-4 text-blue-600" /> },
              { label: 'Course Type', value: selectedCourse.courseType, icon: <FileText className="w-4 h-4 text-blue-600" /> },
              { label: 'Major', value: selectedCourse.major, icon: <GraduationCap className="w-4 h-4 text-blue-600" /> },
              { label: 'Status', value: selectedCourse.status, icon: <Info className="w-4 h-4 text-blue-600" /> },
            ]
          },
          {
            title: "Enrollment & Instructors",
            fields: [
              { label: 'Total Students', value: String(selectedCourse.totalStudents), icon: <Users className="w-4 h-4 text-blue-600" /> },
              { label: 'Total Instructors', value: String(selectedCourse.totalInstructors), icon: <UserCheckIcon className="w-4 h-4 text-blue-600" /> },
            ]
          },
          {
            title: "Timestamps",
            fields: [
              { label: 'Created At', value: selectedCourse.createdAt, type: 'date', icon: <Clock className="w-4 h-4 text-blue-600" /> },
              { label: 'Last Updated', value: selectedCourse.updatedAt, type: 'date', icon: <RefreshCw className="w-4 h-4 text-blue-600" /> },
            ]
          },
          selectedCourse.description ? {
            title: "Description",
            fields: [
              { label: 'Description', value: selectedCourse.description, icon: <FileText className="w-4 h-4 text-blue-600" /> },
            ]
          } : undefined
        ].filter(Boolean) as import('@/components/reusable/Dialogs/ViewDialog').ViewDialogSection[]) : []}
        description={selectedCourse?.department && selectedCourse?.departmentCode ? `Department: ${selectedCourse.department} (${selectedCourse.departmentCode})` : undefined}
        tooltipText="View detailed course information"
      />

      <VisibleColumnsDialog
        open={visibleColumnsDialogOpen}
        onOpenChange={setVisibleColumnsDialogOpen}
        columns={COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onColumnToggle={handleColumnToggle}
        onReset={handleResetColumns}
        title="Manage Course Columns"
        description="Choose which columns to display in the course table"
        searchPlaceholder="Search course columns..."
        enableManualSelection={true}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportCourses}
        entityName="Course"
        templateUrl="/api/courses/template"
        acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
        maxFileSize={5}
      />

      <BulkActionsDialog
        open={bulkActionsDialogOpen}
        onOpenChange={setBulkActionsDialogOpen}
        selectedItems={selectedCoursesForBulkAction}
        entityType="course"
        entityLabel="course"
        availableActions={[
          { id: 'status-update', label: 'Update Status', description: 'Update status of selected courses', icon: <Settings className="w-4 h-4" />, tabId: 'status' },
          { id: 'notification', label: 'Send Notification', description: 'Send notification to instructors', icon: <Bell className="w-4 h-4" />, tabId: 'notifications' },
          { id: 'export', label: 'Export Data', description: 'Export selected courses data', icon: <Download className="w-4 h-4" />, tabId: 'export' },
        ]}
        onActionComplete={handleBulkActionComplete}
        onCancel={handleBulkActionCancel}
        onProcessAction={handleProcessBulkAction}
        getItemDisplayName={(item: Course) => item.name}
        getItemStatus={(item: Course) => item.status}
        getItemId={(item: Course) => item.id}
      />
    </div>
  </div>
  );
} 
