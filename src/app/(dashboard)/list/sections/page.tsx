"use client";

import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, SortAsc, FileDown, Printer, Eye, Pencil, Trash2, School, CheckSquare, Square, ChevronUp, ChevronDown, Loader2, Inbox, RefreshCw, Users, UserCheck, UserX, UserPlus, Upload, Columns3, List, Settings, Bell, Download, RotateCcw } from "lucide-react";
import TableSearch from "@/components/reusable/Search/TableSearch";
import { Pagination } from "@/components/Pagination";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TableHeaderSection } from '@/components/reusable/Table/TableHeaderSection';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TableRowActions } from '@/components/reusable/Table/TableRowActions';
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { PrintLayout } from '@/components/PrintLayout';
import SectionFormDialog from '@/components/forms/SectionFormDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import AttendanceHeader from '../attendance/students/components/AttendanceHeader';
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { format } from 'date-fns';
import { TableExpandedRow } from '@/components/reusable/Table/TableExpandedRow';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { ImportDialog } from '@/components/reusable/Dialogs/ImportDialog';

// Section data model (mirroring backend API response)
interface Section {
  sectionId: number;
  sectionName: string;
  sectionCapacity: number;
  sectionStatus: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  yearLevel: number;
  courseId: number;
  courseName?: string;
  totalStudents: number;
  totalSubjects: number;
  scheduleNotes?: string;
  academicYear?: string;
  semester?: string;
  currentEnrollment?: number;
  roomAssignment?: string;
  createdAt?: string; // Added to match backend and fix linter errors
  updatedAt?: string; // Added to match backend and fix linter errors
  deletedAt?: string; // Added for soft delete functionality
}

// Validation utilities
const validateSection = (section: any): section is Section => {
  return (
    typeof section === 'object' &&
    section !== null &&
    typeof section.sectionId === 'number' &&
    typeof section.sectionName === 'string' &&
    typeof section.sectionCapacity === 'number' &&
    (section.sectionStatus === 'ACTIVE' || section.sectionStatus === 'INACTIVE' || section.sectionStatus === 'DELETED') &&
    typeof section.yearLevel === 'number' &&
    typeof section.courseId === 'number' &&
    typeof section.totalStudents === 'number' &&
    typeof section.totalSubjects === 'number'
  );
};

const validateSections = (sections: any[]): sections is Section[] => {
  return Array.isArray(sections) && sections.every(validateSection);
};

// Fetch sections from API
const fetchSections = async (): Promise<Section[]> => {
  const res = await fetch('/api/sections');
  const data = await res.json();
  if (!Array.isArray(data) || !validateSections(data)) {
    throw new Error('Invalid section data received from server');
  }
  return data;
};

// Define the section schema
const sectionSchema = z.object({
  sectionId: z.number(),
  sectionName: z.string().min(1, "Section name is required"),
  sectionCapacity: z.number().min(1, "Capacity must be at least 1"),
  sectionStatus: z.enum(["ACTIVE", "INACTIVE", "DELETED"]),
  yearLevel: z.number().min(1).max(4, "Year level must be between 1 and 4"),
  courseId: z.number().min(1, "Course is required"),
  Course: z.object({
    courseName: z.string(),
  }).optional(),
  totalStudents: z.number().optional(),
  totalSubjects: z.number().optional(),
});

type SectionFormData = z.infer<typeof sectionSchema>;

// Mock data - replace with actual API calls later
const initialSections: Section[] = [
  {
    sectionId: 1,
    sectionName: "BSIT 1-A",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: 1,
    courseId: 1,
    courseName: "Bachelor of Science in Information Technology",
    totalStudents: 35,
    totalSubjects: 8,
    scheduleNotes: "Monday, Wednesday, Friday",
    academicYear: "2023-2024",
    semester: "1st Semester",
    currentEnrollment: 35,
    roomAssignment: "Room 101",
    createdAt: "2023-01-01T10:00:00Z",
    updatedAt: "2023-01-01T10:00:00Z",
  },
  {
    sectionId: 2,
    sectionName: "BSIT 1-B",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: 1,
    courseId: 1,
    courseName: "Bachelor of Science in Information Technology",
    totalStudents: 38,
    totalSubjects: 8,
    scheduleNotes: "Tuesday, Thursday",
    academicYear: "2023-2024",
    semester: "1st Semester",
    currentEnrollment: 38,
    roomAssignment: "Room 102",
    createdAt: "2023-01-02T11:00:00Z",
    updatedAt: "2023-01-02T11:00:00Z",
  },
  {
    sectionId: 3,
    sectionName: "BSCS 2-A",
    sectionCapacity: 35,
    sectionStatus: "DELETED",
    yearLevel: 2,
    courseId: 2,
    courseName: "Bachelor of Science in Computer Science",
    totalStudents: 0,
    totalSubjects: 0,
    scheduleNotes: "Monday, Wednesday, Friday",
    academicYear: "2023-2024",
    semester: "1st Semester",
    currentEnrollment: 0,
    roomAssignment: "Room 201",
    createdAt: "2023-01-03T09:00:00Z",
    updatedAt: "2023-01-15T14:30:00Z",
    deletedAt: "2023-01-15T14:30:00Z",
  },
];

type SortField = 'name' | 'capacity' | 'yearLevel' | 'status' | 'academicYear' | 'semester' | 'courseName' | 'currentEnrollment' | 'totalSubjects';
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
const DEFAULT_FILTERS = { status: "all", yearLevel: "all", course: "all", academicYear: "all", semester: "all" };
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
// Update SECTION_COLUMNS to remove Room, Notes, Course ID, Semester ID, Created At, Updated At
const SECTION_COLUMNS = [
  { key: "sectionName", label: "Section Name", className: "text-blue-900 align-middle text-center" },
  { key: "sectionCapacity", label: "Capacity", className: "text-blue-800 text-center align-middle px-2" },
  { key: "sectionStatus", label: "Status", className: "text-center align-middle" },
  { key: "yearLevel", label: "Year Level", className: "text-blue-800 text-center align-middle px-2" },
  { key: "academicYear", label: "Academic Year", className: "text-blue-800 text-center align-middle" },
  { key: "semester", label: "Semester", className: "text-blue-800 text-center align-middle" },
  { key: "courseName", label: "Course", className: "text-blue-800 align-middle text-center" },
  { key: "currentEnrollment", label: "Enrolled", className: "text-blue-800 text-center align-middle px-2" },
  { key: "totalSubjects", label: "Subjects", className: "text-blue-800 text-center align-middle px-2" },
];

function getStatusBadgeVariant(status: string) {
  if (status.toLowerCase() === "active") return "success";
  if (status.toLowerCase() === "inactive") return "destructive";
  if (status.toLowerCase() === "deleted") return "secondary";
  return "destructive";
}

function mapSectionForExport(section: any, columns: typeof SECTION_COLUMNS) {
  const row: Record<string, any> = {};
  columns.forEach(col => {
    let value = section[col.key];
    if (col.key === "createdAt" || col.key === "updatedAt") {
      value = value ? format(new Date(value), 'yyyy-MM-dd HH:mm') : '';
    }
    row[col.key] = value ?? '';
  });
  return row;
}

function SectionExpandedRowTabs({ sectionId, colSpan }: { sectionId: number, colSpan: number }) {
  const [tab, setTab] = React.useState<'students' | 'subjects'>('students');
  const [students, setStudents] = React.useState<any[] | null>(null);
  const [subjects, setSubjects] = React.useState<any[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setError(null);
    setLoading(true);
    if (tab === 'students') {
      fetch(`/api/sections/${sectionId}/students`)
        .then(res => res.json())
        .then(data => setStudents(data))
        .catch(() => setError('Failed to load students'))
        .finally(() => setLoading(false));
    } else if (tab === 'subjects') {
      fetch(`/api/sections/${sectionId}/subjects`)
        .then(res => res.json())
        .then(data => setSubjects(data))
        .catch(() => setError('Failed to load subjects'))
        .finally(() => setLoading(false));
    }
  }, [tab, sectionId]);

  // Table headers and rows for each tab
  let headers: string[] = [];
  let rows: any[][] = [];
  if (tab === 'students') {
    headers = ['Name', 'ID Number', 'Year Level', 'Status', 'Email'];
    if (loading) {
      rows = [[{ colSpan: 5, content: 'Loading students...' }]];
    } else if (error) {
      rows = [[{ colSpan: 5, content: error }]];
    } else if (students && students.length > 0) {
      rows = students.map((s: any) => [
        { content: `${s.firstName} ${s.lastName}` },
        { content: s.studentIdNumber },
        { content: s.yearLevel },
        { content: s.status },
        { content: s.email },
      ]);
    } else {
      rows = [[{ colSpan: 5, content: 'No students found for this section.' }]];
    }
  } else if (tab === 'subjects') {
    headers = ['Code', 'Name', 'Units', 'Type', 'Status'];
    if (loading) {
      rows = [[{ colSpan: 5, content: 'Loading subjects...' }]];
    } else if (error) {
      rows = [[{ colSpan: 5, content: error }]];
    } else if (subjects && subjects.length > 0) {
      rows = subjects.map((subj: any) => [
        { content: subj.code, className: 'font-mono text-xs w-20' },
        { content: subj.name, className: 'w-48' },
        { content: subj.units, className: 'w-12 text-center' },
        { content: subj.type, className: 'w-20 text-center capitalize' },
        { content: subj.status, className: 'w-16 text-center capitalize' },
      ]);
    } else {
      rows = [[{ colSpan: 5, content: 'No subjects found for this section.' }]];
    }
  }

  return (
    <td colSpan={colSpan} className="p-0">
      <div className="bg-blue-50 p-4">
        {/* Tabs */}
        <div className="flex gap-2 justify-end mb-4">
          <button
            className={`px-5 py-2 rounded-t-lg font-semibold transition-all duration-150 ${tab === 'students' ? 'bg-white shadow text-blue-900 border-b-2 border-blue-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            onClick={() => setTab('students')}
          >Students</button>
          <button
            className={`px-5 py-2 rounded-t-lg font-semibold transition-all duration-150 ${tab === 'subjects' ? 'bg-white shadow text-blue-900 border-b-2 border-blue-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            onClick={() => setTab('subjects')}
          >Subjects</button>
        </div>
        {/* Table */}
        <Table className="bg-white rounded-md">
          <TableHeader>
            <TableRow>
              {headers.map((header, idx) => (
                <TableHead key={idx} className="bg-blue-100 text-blue-900 font-semibold text-center text-center">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="[&>tr>td]:text-blue-900">
            {rows.map((cells, idx) => (
              <TableRow key={idx}>
                {cells.map((cell, cidx) => (
                  <TableCell key={cidx} colSpan={cell.colSpan || 1} className={`text-center ${cell.className || ''}`}>{cell.content}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </td>
  );
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('name');
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
  const [columnsToExport, setColumnsToExport] = useState<string[]>(["name", "capacity", "status", "yearLevel", "course"]);
  const [pendingExportType, setPendingExportType] = useState<"csv" | "excel" | "pdf" | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSection, setEditSection] = useState<Section | undefined>();
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewSection, setViewSection] = useState<Section | undefined>();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [lastActionTime, setLastActionTime] = useState<string>("");
  // Add expandedRowIds state
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [selectedSectionsForBulkAction, setSelectedSectionsForBulkAction] = useState<Section[]>([]);
  // Add itemsPerPage state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Add state for courses
  const [courses, setCourses] = useState<{ id: string; code: string; name: string }[]>([]);

  // Fetch courses on mount
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data.map((c: any) => ({ id: c.id, code: c.code, name: c.name })));
        }
      })
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      setLoading(true);
      try {
        const data = await fetchSections();
        setSections(data);
      } catch (err: any) {
        toast.error('Failed to load sections. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadSections();
  }, []);

  // Replace handleSort with a version that accepts string accessor
  const handleSort = (accessor: string) => {
    // Map accessor to SortField if possible, fallback to 'name'
    const fieldMap: Record<string, SortField> = {
      sectionName: 'name',
      sectionCapacity: 'capacity',
      sectionStatus: 'status',
      yearLevel: 'yearLevel',
      academicYear: 'academicYear',
      semester: 'semester',
      courseName: 'courseName',
      currentEnrollment: 'currentEnrollment',
      totalSubjects: 'totalSubjects',
    };
    const field = fieldMap[accessor] || 'name';
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
          section.courseName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filters.status !== 'all') {
      result = result.filter((section) => section.sectionStatus.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.yearLevel !== 'all') {
      result = result.filter((section) => String(section.yearLevel) === filters.yearLevel);
    }
    if (filters.course !== 'all') {
      result = result.filter((section) => String(section.courseId) === filters.course);
    }
    if (filters.academicYear !== 'all') {
      result = result.filter((section) => section.academicYear === filters.academicYear);
    }
    if (filters.semester !== 'all') {
      result = result.filter((section) => section.semester === filters.semester);
    }
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Map sortField to actual section property
      const fieldMap: Record<SortField, keyof Section> = {
        name: 'sectionName',
        capacity: 'sectionCapacity',
        status: 'sectionStatus',
        yearLevel: 'yearLevel',
        academicYear: 'academicYear',
        semester: 'semester',
        courseName: 'courseName',
        currentEnrollment: 'currentEnrollment',
        totalSubjects: 'totalSubjects',
      };
      
      const actualField = fieldMap[sortField];
      aValue = a[actualField];
      bValue = b[actualField];
      
      // Handle special cases
      if (sortField === 'currentEnrollment') {
        aValue = typeof a.totalStudents === 'number' ? a.totalStudents : (a.currentEnrollment ?? 0);
        bValue = typeof b.totalStudents === 'number' ? b.totalStudents : (b.currentEnrollment ?? 0);
      }
      
      const modifier = sortOrder === 'asc' ? 1 : -1;
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * modifier;
      if (bValue == null) return -1 * modifier;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      return ((aValue as number) - (bValue as number)) * modifier;
    });
    return result;
  }, [sections, search, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredSections.length / ITEMS_PER_PAGE);
  const paginatedSections = filteredSections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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

  // Define column options for the Visible Columns Dialog
  const COLUMN_OPTIONS: ColumnOption[] = [
    { accessor: 'sectionName', header: 'Section Name', required: true },
    { accessor: 'sectionCapacity', header: 'Capacity' },
    { accessor: 'sectionStatus', header: 'Status' },
    { accessor: 'yearLevel', header: 'Year Level' },
    { accessor: 'academicYear', header: 'Academic Year' },
    { accessor: 'semester', header: 'Semester' },
    { accessor: 'courseName', header: 'Course' },
    { accessor: 'currentEnrollment', header: 'Enrolled' },
    { accessor: 'totalSubjects', header: 'Subjects' },
  ];

  // State for visible columns - show all columns by default
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMN_OPTIONS.map(col => col.accessor));

  // Handler to toggle columns
  const handleColumnToggle = (columnAccessor: string, checked: boolean) => {
    setVisibleColumns(prev => {
      if (checked) {
        return Array.from(new Set([...prev, columnAccessor]));
      } else {
        // Don't allow removing required columns
        const col = COLUMN_OPTIONS.find(c => c.accessor === columnAccessor);
        if (col && col.required) return prev;
        return prev.filter(a => a !== columnAccessor);
      }
    });
  };

  // Handler to reset columns to default - show all columns
  const handleResetColumns = () => {
    setVisibleColumns(COLUMN_OPTIONS.map(col => col.accessor));
  };

  // Table columns
  const columns: TableListColumn<any>[] = [
    {
      header: '',
      accessor: 'expander',
      className: 'w-10 text-center px-1 py-1',
      expandedContent: (item: any) => (
        <SectionExpandedRowTabs sectionId={item.sectionId} colSpan={columns.length} />
      ),
    },
    {
      header: (
        <div className="flex justify-center">
          <SharedCheckbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={handleSelectAll}
            aria-label="Select all sections"
          />
        </div>
      ),
      accessor: 'select',
      className: 'w-10 text-center px-1 py-1',
      render: (item: any) => (
        <div className="flex justify-center">
          <SharedCheckbox
            checked={selectedIds.includes(item.sectionId.toString())}
            onChange={() => handleSelectRow(item.sectionId.toString())}
            aria-label={`Select section ${item.sectionName}`}
          />
        </div>
      ),
    },
    // Only include columns that are in visibleColumns
    ...SECTION_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => ({
      header: (
        <div className="text-center font-medium text-blue-900">
          {col.label}
        </div>
      ),
      accessor: col.key,
      className: col.className,
      sortable: ['sectionName', 'sectionCapacity', 'sectionStatus', 'yearLevel', 'academicYear', 'semester', 'courseName', 'currentEnrollment', 'totalSubjects'].includes(col.key),
      render: (item: any) => {
        if (col.key === 'sectionStatus') {
          return (
            <div className="flex justify-center">
              <Badge variant={getStatusBadgeVariant(item.sectionStatus)} className="text-xs px-3 py-1 rounded-full">
                {item.sectionStatus?.charAt(0).toUpperCase() + item.sectionStatus?.slice(1).toLowerCase()}
              </Badge>
            </div>
          );
        }
        if (col.key === 'currentEnrollment') {
          return (
            <div className="text-center">
              {typeof item.totalStudents === 'number' ? item.totalStudents : (item.currentEnrollment ?? 0)}
            </div>
          );
        }
        return (
          <div className="text-center">
            {item[col.key] ?? ''}
          </div>
        );
      },
    })),
    {
      header: (
        <div className="text-center font-medium text-blue-900 whitespace-nowrap">
          Actions
        </div>
      ),
      accessor: "actions",
      className: "text-center align-middle",
      render: (item: any) => {
        const hasRelationships = false;
        const isDeleted = item.sectionStatus === 'DELETED';
        
        if (isDeleted) {
          // For deleted sections, show custom restore button
          return (
            <div className="flex gap-1 justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`View ${item.sectionName}`}
                      className="hover:bg-blue-50"
                      onClick={() => { setViewSection(item); setViewDialogOpen(true); }}
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
                      aria-label={`Edit ${item.sectionName}`}
                      className="hover:bg-green-50"
                      onClick={() => { setEditSection(item); setEditDialogOpen(true); }}
                      disabled={hasRelationships}
                    >
                      <Pencil className="h-4 w-4 text-green-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                    Edit
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Restore ${item.sectionName}`}
                      className="hover:bg-green-50"
                      onClick={() => handleRestore(item)}
                      disabled={hasRelationships}
                    >
                      <RotateCcw className="h-4 w-4 text-green-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                    Restore this section
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        } else {
          // For active/inactive sections, show delete action
          const deleteTooltip = hasRelationships
            ? "Cannot delete section with relationships."
            : "Soft delete this section";
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
    }
  ];

  const allExportColumns = SECTION_COLUMNS.filter(col => [
    "name", "capacity", "status", "yearLevel", "course"
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
    // Use visibleColumns to match the current table view
    const printColumns = visibleColumns.map(key => {
      const col = SECTION_COLUMNS.find(c => c.key === key);
      return {
        header: col?.label || key,
        accessor: key,
      };
    });
    const printData = filteredSections.map(section => {
      const row: Record<string, any> = {};
      visibleColumns.forEach(col => {
        if (col === "courseName") {
          row[col] = section.courseName || "";
        } else if (col === "currentEnrollment") {
          row[col] = typeof section.totalStudents === 'number' ? section.totalStudents : (section.currentEnrollment ?? 0);
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

  // Soft delete function for individual section
  const handleSoftDelete = async (section: Section) => {
    try {
      // Simulate API call for soft delete
      await new Promise(res => setTimeout(res, 500));
      
      // Update the section status to DELETED and add deletedAt timestamp
      const updatedSection: Section = {
        ...section,
        sectionStatus: 'DELETED' as const,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSections(prev => prev.map(s => 
        s.sectionId === section.sectionId ? updatedSection : s
      ));
      
      toast.success(`Section "${section.sectionName}" has been soft deleted.`);
    } catch (err) {
      toast.error("Failed to soft delete section.");
    }
  };

  // Soft delete function for bulk sections
  const handleBulkSoftDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      // Simulate API call for bulk soft delete
      await new Promise(res => setTimeout(res, 1000));
      
      const currentTime = new Date().toISOString();
      
      // Update all selected sections to DELETED status
      setSections(prev => prev.map(section => 
        selectedIds.includes(section.sectionId.toString()) 
          ? {
              ...section,
              sectionStatus: 'DELETED' as const,
              deletedAt: currentTime,
              updatedAt: currentTime
            }
          : section
      ));
      
      setSelectedIds([]);
      toast.success(`${selectedIds.length} section(s) have been soft deleted successfully.`);
    } catch (err) {
      toast.error("Failed to soft delete sections.");
    }
    setBulkDeleteLoading(false);
    setBulkDeleteDialogOpen(false);
  };

  // Restore function for individual section
  const handleRestore = async (section: Section) => {
    try {
      // Simulate API call for restore
      await new Promise(res => setTimeout(res, 500));
      
      // Update the section status back to ACTIVE and remove deletedAt
      const updatedSection: Section = {
        ...section,
        sectionStatus: 'ACTIVE' as const,
        deletedAt: undefined,
        updatedAt: new Date().toISOString()
      };
      
      setSections(prev => prev.map(s => 
        s.sectionId === section.sectionId ? updatedSection : s
      ));
      
      toast.success(`Section "${section.sectionName}" has been restored.`);
    } catch (err) {
      toast.error("Failed to restore section.");
    }
  };

  // Restore function for bulk sections
  const handleBulkRestore = async () => {
    try {
      // Simulate API call for bulk restore
      await new Promise(res => setTimeout(res, 1000));
      
      const currentTime = new Date().toISOString();
      
      // Update all selected sections back to ACTIVE status
      setSections(prev => prev.map(section => 
        selectedIds.includes(section.sectionId.toString()) 
          ? {
              ...section,
              sectionStatus: 'ACTIVE' as const,
              deletedAt: undefined,
              updatedAt: currentTime
            }
          : section
      ));
      
      setSelectedIds([]);
      toast.success(`${selectedIds.length} section(s) have been restored successfully.`);
    } catch (err) {
      toast.error("Failed to restore sections.");
    }
  };

  // Update status values to lowercase
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'deleted', label: 'Deleted' },
  ];

  // Update status badge variant
  const getStatusVariant = (status: string) => {
    if (status.toLowerCase() === "active") return "success";
    if (status.toLowerCase() === "inactive") return "destructive";
    if (status.toLowerCase() === "deleted") return "secondary";
    return "destructive";
  };

  // Update filterFields to use the local type
  const filterFields: FilterField[] = [
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
  // Update exportableColumns to match
  const exportableColumns = [
    { accessor: 'sectionName', label: 'Section Name' },
    { accessor: 'sectionCapacity', label: 'Capacity' },
    { accessor: 'sectionStatus', label: 'Status' },
    { accessor: 'yearLevel', label: 'Year Level' },
    { accessor: 'courseName', label: 'Course' },
    { accessor: 'currentEnrollment', label: 'Enrolled' },
    { accessor: 'totalSubjects', label: 'Subjects' },
  ];

  // Summary card metrics
  const totalSections = sections.length;
  const activeSections = sections.filter(s => s.sectionStatus === 'ACTIVE').length;
  const inactiveSections = sections.filter(s => s.sectionStatus === 'INACTIVE').length;
  const deletedSections = sections.filter(s => s.sectionStatus === 'DELETED').length;
  const totalStudents = sections.reduce((sum, s) => sum + (s.totalStudents || 0), 0);

  // Quick Actions handlers
  const handleRefresh = () => {
    refreshSections();
    setLastActionTime(new Date().toLocaleTimeString());
  };

  // Update TableCardView getItem* helpers
  const getItemId = (item: any) => item.sectionId?.toString() || item.id;
  const getItemName = (item: any) => item.sectionName || item.name;
  const getItemCode = (item: any) => item.sectionType || item.type;
  const getItemStatus = (item: any) => (item.sectionStatus || item.status || '').toLowerCase();
  const getItemDescription = (item: any) => `Year Level ${item.yearLevel}`;
  const getItemDetails = (item: any) => [
    { label: 'Capacity', value: item.sectionCapacity },
    { label: 'Enrolled', value: item.currentEnrollment },
    { label: 'Room', value: item.roomAssignment },
  ];

  // Helper to get selected sections
  const selectedSections = sections.filter(s => selectedIds.includes(s.sectionId.toString()));

  // Debug: Log selectedIds whenever they change
  useEffect(() => {
    console.log('Selected section IDs:', selectedIds);
  }, [selectedIds]);

  // Handler for enhanced bulk actions
  const handleOpenBulkActionsDialog = () => {
    setSelectedSectionsForBulkAction(selectedSections);
    setBulkActionsDialogOpen(true);
  };

  // Handler for dialog action complete
  const handleBulkActionComplete = (actionType: string, results: any) => {
    toast.success(`Bulk action '${actionType}' completed.`);
    setBulkActionsDialogOpen(false);
    setSelectedSectionsForBulkAction([]);
  };

  // Handler for dialog cancel
  const handleBulkActionCancel = () => {
    setBulkActionsDialogOpen(false);
    setSelectedSectionsForBulkAction([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Sections"
          subtitle="Manage class sections and assignments"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Academic Management', href: '/academic-management' },
            { label: 'Sections' }
          ]}
        />
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <SummaryCard
            icon={<Users className="text-blue-700 w-5 h-5" />}
            label="Total Sections"
            value={totalSections}
            valueClassName="text-blue-900"
            sublabel="Registered sections"
            loading={loading}
          />
          <SummaryCard
            icon={<UserCheck className="text-green-600 w-5 h-5" />}
            label="Active Sections"
            value={activeSections}
            valueClassName="text-blue-900"
            sublabel="Currently active"
            loading={loading}
          />
          <SummaryCard
            icon={<UserX className="text-yellow-600 w-5 h-5" />}
            label="Inactive Sections"
            value={inactiveSections}
            valueClassName="text-blue-900"
            sublabel="Inactive/archived"
            loading={loading}
          />
          <SummaryCard
            icon={<UserPlus className="text-purple-600 w-5 h-5" />}
            label="Total Students"
            value={totalStudents}
            valueClassName="text-blue-900"
            sublabel="Enrolled in all sections"
            loading={loading}
          />
        </div>
        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential tools and shortcuts"
            icon={<div className="w-6 h-6 text-white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>}
            actionCards={[
              {
                id: 'add-section',
                label: 'Add Section',
                description: 'Create new section',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => setAddDialogOpen(true)
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import sections from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print section list',
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
                description: 'Reload section data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: handleRefresh,
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
            lastActionTime={lastActionTime}
            onLastActionTimeChange={setLastActionTime}
            collapsible={true}
            defaultCollapsed={true}
          />
        </div>
        {/* Section List Header and Filters (standalone, not in Card) */}
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
                      <h3 className="text-lg font-bold text-white">Section List</h3>
                      <p className="text-blue-100 text-sm">Search and filter section information</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            {/* Search and Filter Row */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-end">
                {/* Search Bar */}
                <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sections..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="w-auto min-w-fit text-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.yearLevel} onValueChange={v => setFilters(f => ({ ...f, yearLevel: v }))}>
                    <SelectTrigger className="w-auto min-w-fit text-gray-700">
                      <SelectValue placeholder="Year Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* In the Courses filter, wrap SelectContent in ScrollArea */}
                  <Select value={filters.course} onValueChange={v => setFilters(f => ({ ...f, course: v }))}>
                    <SelectTrigger className="w-auto min-w-fit text-gray-700">
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-60 w-full">
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>{course.code}</SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  {/* Academic Year Filter */}
                  <Select value={filters.academicYear} onValueChange={v => setFilters(f => ({ ...f, academicYear: v }))}>
                    <SelectTrigger className="w-auto min-w-fit text-gray-700">
                      <SelectValue placeholder="Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {/* Dynamically generate options from sections data */}
                      {Array.from(new Set(sections.map(s => s.academicYear).filter(Boolean))).map(year => (
                        <SelectItem key={year} value={year!}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Semester Filter */}
                  <Select value={filters.semester} onValueChange={v => setFilters(f => ({ ...f, semester: v }))}>
                    <SelectTrigger className="w-auto min-w-fit text-gray-700">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      <SelectItem value="FIRST_SEMESTER">First Trimester</SelectItem>
                      <SelectItem value="SECOND_SEMESTER">Second Trimester</SelectItem>
                      <SelectItem value="THIRD_SEMESTER">Third Trimester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Table Content */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              {/* Bulk Actions Bar: Render for both desktop and mobile */}
              {selectedIds.length > 0 && (
                <div className="mt-4 mb-2">
                  <BulkActionsBar
                    selectedCount={selectedIds.length}
                    entityLabel="section"
                    actions={[
                      {
                        key: 'bulk-actions',
                        label: 'Bulk Actions',
                        icon: <Settings className="w-4 h-4 mr-2" />,
                        onClick: handleOpenBulkActionsDialog,
                        tooltip: 'Open enhanced bulk actions dialog for selected sections',
                        variant: 'default',
                      },
                      {
                        key: 'export',
                        label: 'Quick Export',
                        icon: <Download className="w-4 h-4 mr-2" />,
                        onClick: () => handleExport('csv'),
                        tooltip: 'Quick export selected sections to CSV',
                        variant: 'outline',
                      },
                      {
                        key: 'delete',
                        label: 'Soft Delete',
                        icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                        onClick: () => setBulkDeleteDialogOpen(true),
                        loading: loading,
                        disabled: loading,
                        tooltip: 'Soft delete selected sections',
                        variant: 'destructive',
                      },
                      {
                        key: 'restore',
                        label: 'Restore',
                        icon: <RotateCcw className="w-4 h-4 mr-2" />,
                        onClick: handleBulkRestore,
                        tooltip: 'Restore selected deleted sections',
                        variant: 'outline',
                      },
                    ]}
                    onClear={() => setSelectedIds([])}
                    className=""
                  />
                </div>
              )}
              {/* Table layout for xl+ only */}
              <div className="hidden xl:block overflow-x-auto max-w-full">
                <TableList
                  columns={columns}
                  data={paginatedSections}
                  loading={loading}
                  selectedIds={selectedIds}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAll}
                  isAllSelected={isAllSelected}
                  isIndeterminate={isIndeterminate}
                  getItemId={item => item.sectionId?.toString()}
                  expandedRowIds={expandedRowIds}
                  onToggleExpand={itemId => {
                    setExpandedRowIds(current =>
                      current.includes(itemId)
                        ? current.filter(id => id !== itemId)
                        : [...current, itemId]
                    );
                  }}
                  className="border-0 shadow-none max-w-full text-center"
                  sortState={{ field: sortField, order: sortOrder }}
                  onSort={handleSort}
                />
              </div>
              {/* Card layout for small screens */}
              <div className="block xl:hidden">
                <TableCardView
                  items={paginatedSections}
                  selectedIds={selectedIds}
                  onSelect={id => handleSelectRow(id)}
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
                  getItemId={item => item.sectionId?.toString()}
                  getItemName={getItemName}
                  getItemCode={getItemCode}
                  getItemStatus={getItemStatus}
                  getItemDescription={getItemDescription}
                  getItemDetails={getItemDetails}
                  isLoading={loading}
                />
              </div>
              {/* PAGINATION */}
              <div className="mt-6">
                <TablePagination
                  page={currentPage}
                  pageSize={itemsPerPage}
                  totalItems={filteredSections.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  entityLabel="section"
                />
              </div>
            </div> {/* End Table Content */}
          </Card>
        </div>
        {/* Dialogs and overlays remain outside the Card and main content wrapper */}
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          exportableColumns={[
            { key: 'name', label: 'Section Name' },
            { key: 'capacity', label: 'Capacity' },
            { key: 'status', label: 'Status' },
            { key: 'yearLevel', label: 'Year Level' },
            { key: 'course', label: 'Course' },
            { key: 'totalStudents', label: 'Students' },
            { key: 'totalSubjects', label: 'Subjects' },
          ]}
          exportColumns={columnsToExport}
          setExportColumns={setColumnsToExport}
          exportFormat={pendingExportType}
          setExportFormat={setPendingExportType}
          onExport={doExport}
          title="Export Sections"
          tooltip="Export section data in various formats. Choose your preferred export options."
        />

        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortFieldOptions={[
            { value: 'name', label: 'Section Name' },
            { value: 'capacity', label: 'Capacity' },
            { value: 'yearLevel', label: 'Year Level' },
            { value: 'status', label: 'Status' },
            { value: 'academicYear', label: 'Academic Year' },
            { value: 'semester', label: 'Semester' },
            { value: 'courseName', label: 'Course' },
            { value: 'currentEnrollment', label: 'Enrolled Students' },
            { value: 'totalSubjects', label: 'Total Subjects' },
          ]}
          onApply={handleApplyFilters}
          onReset={() => {
            setSortField('name');
            setSortOrder('asc');
          }}
          title="Sort Sections"
          tooltip="Sort sections by different fields. Choose the field and order to organize your list."
        />

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

        <SectionFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          type="update"
          data={editSection}
          onSuccess={(updatedSection: SectionFormData) => {
            if (!editSection) return;
            setSections((prev) => prev.map(s =>
              s.sectionId === editSection.sectionId
                ? { ...s, yearLevel: Number(updatedSection.yearLevel), courseId: Number(updatedSection.courseId) }
                : s
            ));
            setEditDialogOpen(false);
            toast.success("Section updated successfully");
          }}
        />

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
                { label: 'Section Name', value: viewSection.sectionName ?? '-' },
                { label: 'Year Level', value: viewSection.yearLevel ?? '-' },
                { label: 'Course', value: viewSection.courseName ?? '-' },
                { label: 'Academic Year', value: viewSection.academicYear ?? '-' },
                { label: 'Semester', value: viewSection.semester ?? '-' },
              ],
              columns: 2,
            },
            {
              title: 'Capacity & Enrollment',
              fields: [
                { label: 'Capacity', value: viewSection.sectionCapacity ?? '-' },
                { label: 'Enrolled', value: viewSection.currentEnrollment ?? '-' },
                { label: 'Subjects', value: viewSection.totalSubjects ?? '-' },
              ],
              columns: 2,
            },
            {
              title: 'Schedule & Room',
              fields: [
                { label: 'Room Assignment', value: viewSection.roomAssignment ?? '-' },
                { label: 'Schedule Notes', value: viewSection.scheduleNotes ?? '-' },
              ],
              columns: 2,
            },
            {
              title: 'Metadata',
              fields: [
                { label: 'Section ID', value: viewSection.sectionId },
                { label: 'Created At', value: viewSection.createdAt ? format(new Date(viewSection.createdAt), "yyyy-MM-dd HH:mm") : '-' },
                { label: 'Updated At', value: viewSection.updatedAt ? format(new Date(viewSection.updatedAt), "yyyy-MM-dd HH:mm") : '-' },
              ],
              columns: 2,
            },
          ] : []}
        />

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemName={sectionToDelete?.sectionName}
          onDelete={async () => {
            if (!sectionToDelete) return;
            await handleSoftDelete(sectionToDelete);
            setDeleteDialogOpen(false);
            setSectionToDelete(null);
          }}
          description="Are you sure you want to soft delete this section? This will mark it as deleted but it can be restored later."
        />

        <ConfirmDeleteDialog
          open={bulkDeleteDialogOpen}
          onOpenChange={setBulkDeleteDialogOpen}
          itemName={`${selectedIds.length} selected section(s)`}
          onDelete={handleBulkSoftDelete}
          loading={bulkDeleteLoading}
          description={`Are you sure you want to soft delete ${selectedIds.length} selected section(s)? This will mark them as deleted but they can be restored later.`}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={selectedSectionsForBulkAction}
          entityType="schedule"
          entityLabel="section"
          availableActions={[
            {
              type: 'status-update',
              title: 'Update Status',
              description: 'Activate, deactivate, or archive sections',
              icon: <Settings className="w-4 h-4" />,
            },
            {
              type: 'notification',
              title: 'Send Notifications',
              description: 'Send announcements and notifications to sections',
              icon: <Bell className="w-4 h-4" />,
            },
            {
              type: 'export',
              title: 'Export & Reports',
              description: 'Export section data and generate reports',
              icon: <Download className="w-4 h-4" />,
            }
          ]}
          exportColumns={[
            { id: 'sectionName', label: 'Section Name', default: true },
            { id: 'sectionCapacity', label: 'Capacity', default: true },
            { id: 'sectionStatus', label: 'Status', default: true },
            { id: 'yearLevel', label: 'Year Level', default: true },
            { id: 'academicYear', label: 'Academic Year', default: false },
            { id: 'semester', label: 'Semester', default: false },
            { id: 'courseName', label: 'Course', default: true },
            { id: 'currentEnrollment', label: 'Enrolled Students', default: false },
            { id: 'totalStudents', label: 'Total Students', default: false },
            { id: 'totalSubjects', label: 'Total Subjects', default: false },
            { id: 'roomAssignment', label: 'Room Assignment', default: false },
            { id: 'scheduleNotes', label: 'Schedule Notes', default: false },
          ]}
          notificationTemplates={[
            {
              id: 'status-update',
              name: 'Section Status Update',
              subject: 'Section Status Changed',
              message: 'The status of your section has been updated to {status}.',
              availableFor: ['schedule'],
            },
            {
              id: 'academic-change',
              name: 'Academic Configuration Update',
              subject: 'Academic Settings Updated',
              message: 'Your section academic settings have been updated. New year level: {yearLevel}, Semester: {semester}.',
              availableFor: ['schedule'],
            },
            {
              id: 'room-assignment',
              name: 'Room Assignment Update',
              subject: 'Room Assignment Changed',
              message: 'Your section has been assigned to {room}. Schedule: {schedule}.',
              availableFor: ['schedule'],
            },
            {
              id: 'capacity-change',
              name: 'Capacity Update',
              subject: 'Section Capacity Updated',
              message: 'Your section capacity has been updated to {capacity} students.',
              availableFor: ['schedule'],
            },
            {
              id: 'general-announcement',
              name: 'General Announcement',
              subject: 'Section Announcement',
              message: 'Important announcement for your section: {message}.',
              availableFor: ['schedule'],
            },
            {
              id: 'schedule-update',
              name: 'Schedule Update',
              subject: 'Schedule Change Notification',
              message: 'Your section schedule has been updated. New schedule: {schedule}.',
              availableFor: ['schedule'],
            }
          ]}
          stats={{
            total: selectedSectionsForBulkAction.length,
            active: selectedSectionsForBulkAction.filter(s => s.sectionStatus === 'ACTIVE').length,
            inactive: selectedSectionsForBulkAction.filter(s => s.sectionStatus === 'INACTIVE').length,
            custom: {
              'Deleted': selectedSectionsForBulkAction.filter(s => s.sectionStatus === 'DELETED').length,
              '1st Year': selectedSectionsForBulkAction.filter(s => s.yearLevel === 1).length,
              '2nd Year': selectedSectionsForBulkAction.filter(s => s.yearLevel === 2).length,
              '3rd Year': selectedSectionsForBulkAction.filter(s => s.yearLevel === 3).length,
              '4th Year': selectedSectionsForBulkAction.filter(s => s.yearLevel === 4).length,
              'Total Capacity': selectedSectionsForBulkAction.reduce((sum, s) => sum + (s.sectionCapacity || 0), 0),
              'Total Enrolled': selectedSectionsForBulkAction.reduce((sum, s) => sum + (s.currentEnrollment || 0), 0),
            }
          }}
          onActionComplete={handleBulkActionComplete}
          onCancel={handleBulkActionCancel}
          onProcessAction={async (actionType: string, config: any) => {
            // Enhanced action processing for different bulk operations
            try {
              switch (actionType) {
                case 'status-update':
                  toast.success(`Status updated to '${config.status}' for ${selectedSectionsForBulkAction.length} section(s).`);
                  break;
                case 'academic-config':
                  toast.success(`Academic settings updated for ${selectedSectionsForBulkAction.length} section(s).`);
                  break;
                case 'capacity-management':
                  toast.success(`Capacity settings updated for ${selectedSectionsForBulkAction.length} section(s).`);
                  break;
                case 'room-schedule':
                  toast.success(`Room and schedule updated for ${selectedSectionsForBulkAction.length} section(s).`);
                  break;
                case 'communication':
                  toast.success(`Notification sent to ${selectedSectionsForBulkAction.length} section(s).`);
                  break;
                case 'data-operations':
                  toast.success(`Data exported for ${selectedSectionsForBulkAction.length} section(s).`);
                  break;
                case 'advanced-operations':
                  toast.success(`Advanced operation completed for ${selectedSectionsForBulkAction.length} section(s).`);
                  break;
                default:
                  toast.success(`Action '${actionType}' completed for ${selectedSectionsForBulkAction.length} section(s).`);
              }
              
              // Simulate API call delay
              await new Promise(resolve => setTimeout(resolve, 800));
              
              return { 
                success: true, 
                processed: selectedSectionsForBulkAction.length,
                details: {
                  actionType,
                  config,
                  timestamp: new Date().toISOString()
                }
              };
            } catch (error) {
              toast.error(`Failed to process ${actionType} action. Please try again.`);
              return { 
                success: false, 
                processed: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          }}
          getItemDisplayName={(item: Section) => item.sectionName}
          getItemStatus={(item: Section) => item.sectionStatus}
        />

        {/* Visible Columns Dialog */}
        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={COLUMN_OPTIONS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onReset={handleResetColumns}
          title="Manage Section Columns"
          description="Choose which columns to display in the section table"
          searchPlaceholder="Search section columns..."
          enableManualSelection={true}
          onManualSelectionChange={(state) => {
            // Optionally persist to localStorage or analytics
          }}
        />

        {/* Import Dialog for Section Import */}
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          entityName="section"
          onImport={async (data) => {
            // TODO: Implement actual import logic for sections
            toast.success(`${data.length} section(s) imported (stub handler)`);
            setImportDialogOpen(false);
            return { success: data.length, failed: 0, errors: [] };
          }}
        />
      </div>
    </div>
  );
}
