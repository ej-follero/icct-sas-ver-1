"use client";

import { useState, useMemo, useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";
import { z } from "zod";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil, Trash2, Loader2, BadgeInfo, CheckSquare, Square, Settings, Bell, Download, ChevronUp, ChevronDown, BookOpen, CheckCircle, XCircle, Calculator, FileText, Clock, User, Layers, Eye, AlertCircle, Info, RotateCcw, Upload, Printer, Columns3, RefreshCw, List, Archive } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Checkbox as SharedCheckbox } from "@/components/ui/checkbox";
import { TableHeaderSection } from "@/components/reusable/Table/TableHeaderSection";
import { TableList, TableListColumn } from "@/components/reusable/Table/TableList";
import { TableCardView } from "@/components/reusable/Table/TableCardView";

import { FilterDialog } from "@/components/FilterDialog";
import { ExportDialog } from "@/components/reusable/Dialogs/ExportDialog";
import { SortDialog } from "@/components/reusable/Dialogs/SortDialog";
import { PrintLayout } from "@/components/PrintLayout";
import { TableRowActions } from "@/components/reusable/Table/TableRowActions";
import { Pagination } from "@/components/Pagination";
import Fuse from "fuse.js";
import SubjectForm from "@/components/forms/SubjectForm";
import { ViewDialog } from "@/components/reusable/Dialogs/ViewDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import SubjectFormDialog from '@/components/forms/SubjectFormDialog';
import { useDebounce } from '@/hooks/use-debounce';
import { subjectsApi } from '@/services/api/subjects';
import { Subject } from '@/types/subject';
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';

import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { ImportDialog } from "@/components/reusable/Dialogs/ImportDialog";
import { EmptyState } from '@/components/reusable';
import { SummaryCardSkeleton, PageSkeleton } from '@/components/reusable/Skeleton';
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { TableExpandedRow } from '@/components/reusable/Table/TableExpandedRow';
import { departmentsApi } from '@/services/api/departments';
import BulkActionsBar from "@/components/reusable/BulkActionsBar";
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';

type SortField = 'subjectName' | 'subjectCode' | 'subjectType' | 'creditedUnits' | 'semester' | 'academicYear' | 'department' | 'status' | 'maxStudents' | 'totalHours';
type SortOrder = 'asc' | 'desc';



// Centralized badge variant logic
function getTypeBadgeVariant(type: string) {
  switch (type) {
    case 'HYBRID': return 'secondary';
    case 'LECTURE': return 'success';
    case 'LABORATORY': return 'warning';
    case 'THESIS': return 'default';
    case 'RESEARCH': return 'default';
    case 'INTERNSHIP': return 'default';
    default: return 'default';
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'INACTIVE': return 'destructive';
    case 'ARCHIVED': return 'default';
    case 'PENDING_REVIEW': return 'warning';
    default: return 'default';
  }
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState<Subject | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [canDelete, setCanDelete] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    semester: "all",
    year_level: "all",
    departmentId: "all", // Use departmentId instead of department name
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add sortFields state and setSortFields function
  const [sortFields, setSortFields] = useState<{ field: SortField; order: SortOrder }[]>([
    { field: 'subjectName', order: 'asc' }
  ]);

  const [sortField, setSortField] = useState<SortField>('subjectName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setSortDialogOpen(false);
  };

  // Remove the custom SortableHeader component

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subjectsApi.fetchSubjects({
        page: currentPage,
        pageSize: itemsPerPage,
        search: debouncedSearchTerm,
        type: filters.type,
        semester: filters.semester,
        year_level: filters.year_level,
        department: filters.departmentId, // Send departmentId to API
        status: statusFilter,
        sortField,
        sortOrder,
      });
      console.log("Fetched subjects:", data); // Debugging line
      setSubjects(data.subjects);
      setTotalSubjects(data.total);
    } catch (err: any) {
      console.error("Error fetching subjects:", err); // Debugging line
      setError(err.message);
      setSubjects([]);
      setTotalSubjects(0);
    } finally {
      setLoading(false);
    }
  };

  async function handleDeleteSubject(id: string) {
    try {
      await subjectsApi.deleteSubject(id);
      setSubjects(subjects.filter(subject => subject.subjectId && subject.subjectId.toString() !== id));
      toast.success("Subject deleted successfully");
      setDeleteDialogOpen(false);
      setSubjectToDelete(null);
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error.message || "Failed to delete subject");
    }
  }

  const handleExportToCSV = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Academic Year", "Department", "Instructors"];
    const csvContent = [
      headers.join(","),
      ...paginatedSubjects.map(subject => [
        subject.subjectName,
        subject.subjectCode,
        subject.subjectType,
        subject.creditedUnits,
        subject.semester,
        subject.academicYear,
        subject.department?.departmentName || '',
        subject.instructors?.map(i => `${i.firstName} ${i.lastName}`).join("; ") || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subjects.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Academic Year", "Department", "Instructors"];
    const rows = (paginatedSubjects || []).map(subject => [
      subject.subjectName,
      subject.subjectCode,
      subject.subjectType,
      subject.creditedUnits,
      subject.semester,
      subject.academicYear,
      subject.department?.departmentName || '',
      subject.instructors?.map(i => `${i.firstName} ${i.lastName}`).join("; ") || ""
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
    
    XLSX.writeFile(workbook, "subjects.xlsx");
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Subjects List", 14, 15);
    
    const headers = ["Subject Name", "Code", "Type", "Units", "Semester", "Academic Year", "Department"];
    const rows = (paginatedSubjects || []).map(subject => [
      subject.subjectName,
      subject.subjectCode,
      subject.subjectType,
      subject.creditedUnits.toString(),
      subject.semester,
      subject.academicYear,
      subject.department?.departmentName || ''
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("subjects.pdf");
  };

  const handlePrint = () => {
    const printColumns = [
      { header: 'Subject Name', accessor: 'subjectName' },
      { header: 'Code', accessor: 'subjectCode' },
      { header: 'Type', accessor: 'subjectType' },
      { header: 'Units', accessor: 'creditedUnits' },
      { header: 'Semester', accessor: 'semester' },
      { header: 'Academic Year', accessor: 'academicYear' },
      { header: 'Department', accessor: 'department' },
    ];

    // Transform the data to flatten the department object
    const printData = (paginatedSubjects || []).map(subject => ({
      ...subject,
      department: subject.department?.departmentName || ''
    }));

    const printFunction = PrintLayout({
      title: 'Subjects List',
      data: printData,
      columns: printColumns,
      totalItems: (subjects || []).length,
    });

    printFunction();
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
      semester: "all",
      year_level: "all",
      departmentId: "all",
    });
  };

  // Fetch on page/filter/search/sort change
  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filters, statusFilter, sortField, sortOrder]);

  // Reset pagination on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, statusFilter]);

  // No need for client-side pagination, use server-side data
  const paginatedSubjects = subjects;
  const safeItemsPerPage = itemsPerPage > 0 ? itemsPerPage : 10;
  const safeTotalSubjects = Number.isFinite(totalSubjects) ? totalSubjects : 0;
  const totalPages = Math.max(1, Math.ceil(safeTotalSubjects / safeItemsPerPage));
  const safeCurrentPage = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1;

  // Reset currentPage to 1 if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages]);





  const refreshSubjects = async () => {
    try {
      setIsRefreshing(true);
      const data = await subjectsApi.fetchSubjects({
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setSubjects(data.subjects);
      setTotalSubjects(data.total);
      toast.success('Subjects refreshed successfully');
    } catch (err: any) {
      console.error('Error refreshing subjects:', err);
      toast.error(err.message || 'Failed to refresh subjects. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };



  const handleExport = async (format: 'pdf' | 'excel' | 'csv', options?: any) => {
    const selectedColumns = exportableColumnsForExport.filter(col => exportColumns.includes(col.key));
    const headers = selectedColumns.map(col => col.label);
    const rows = (subjects || []).map((subject) =>
      selectedColumns.map((col) => {
        // Handle special cases for nested objects
        if (col.key === 'department') {
          return String(subject.department?.departmentName || '');
        }

        return String(subject[col.key as keyof Subject] || '');
      })
    );

    switch (format) {
      case 'csv':
        handleExportToCSV();
        break;
      case 'excel':
        handleExportToExcel();
        break;
      case 'pdf':
        handleExportToPDF();
        break;
    }
  };

  // Centralized subject columns definition
  const subjectColumns = [
    { key: 'subjectName', label: 'Subject Name', accessor: 'subjectName', className: 'text-blue-900' },
    { key: 'subjectCode', label: 'Code', accessor: 'subjectCode', className: 'text-blue-900' },
    { key: 'subjectType', label: 'Type', accessor: 'subjectType', className: 'text-center' },
    { key: 'creditedUnits', label: 'Units', accessor: 'creditedUnits', className: 'text-center text-blue-900 px-2' },
    { key: 'semester', label: 'Semester', accessor: 'semester', className: 'text-center text-blue-900' },
    { key: 'academicYear', label: 'Academic Year', accessor: 'academicYear', className: 'text-center text-blue-900' },
    { key: 'department', label: 'Department', accessor: 'department', className: 'text-center align-middle text-blue-900' },
    { key: 'status', label: 'Status', accessor: 'status', className: 'text-center' },
    { key: 'maxStudents', label: 'Max Students', accessor: 'maxStudents', className: 'text-center px-2' },
    { key: 'totalHours', label: 'Total Hours', accessor: 'totalHours', className: 'text-center px-2' },
  ];

  // For TableHeaderSection
  const exportableColumns: { accessor: string; label: string }[] = subjectColumns.map((col) => ({ accessor: col.key, label: col.label }));
  // For ExportDialog and export
  const exportableColumnsForExport: { key: string; label: string }[] = subjectColumns.map((col) => ({ key: col.key, label: col.label }));

  const [exportColumns, setExportColumns] = useState(exportableColumnsForExport.map(col => col.key));
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState(subjectColumns.map(col => col.key));

  // Column options for dialog
  const COLUMN_OPTIONS: ColumnOption[] = subjectColumns.map(col => ({
    accessor: col.key,
    header: col.label,
    description: col.label,
    category: 'Basic Info',
    required: col.key === 'subjectName' || col.key === 'subjectCode',
  }));

  // Column toggle handler
  const handleColumnToggle = (columnAccessor: string, checked: boolean) => {
    if (checked) {
      setVisibleColumns(prev => [...prev, columnAccessor]);
    } else {
      setVisibleColumns(prev => prev.filter(col => col !== columnAccessor));
    }
  };
  const handleResetColumns = () => {
    setVisibleColumns(subjectColumns.map(col => col.key));
    toast.success('Column visibility reset to default');
  };

  // Add state for selectedIds
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [selectedSubjectsForBulkAction, setSelectedSubjectsForBulkAction] = useState<Subject[]>([]);

  // Bulk selection logic
  const isAllSelected = paginatedSubjects?.length > 0 && paginatedSubjects.every(s => s.subjectId && selectedIds.includes(s.subjectId.toString()));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      const allIds = paginatedSubjects.filter(s => s.subjectId).map(s => s.subjectId.toString());
      setSelectedIds(allIds);
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Bulk actions handlers
  const handleOpenBulkActionsDialog = () => {
    const selectedSubjects = paginatedSubjects.filter(s => s.subjectId && selectedIds.includes(s.subjectId.toString()));
    setSelectedSubjectsForBulkAction(selectedSubjects);
    setBulkActionsDialogOpen(true);
  };

  const handleBulkActionComplete = (actionType: string, results: any) => {
    setBulkActionsDialogOpen(false);
    setSelectedSubjectsForBulkAction([]);
    
    // Handle results based on action type
    if (results && results.success) {
      toast.success(`${actionType} completed successfully`);
      refreshSubjects();
    } else if (results && results.error) {
      toast.error(`${actionType} failed: ${results.error}`);
    }
  };

  const handleBulkActionCancel = () => {
    setBulkActionsDialogOpen(false);
    setSelectedSubjectsForBulkAction([]);
  };

  const handleProcessBulkAction = async (actionType: string, config: any): Promise<{ success: boolean; processed?: number }> => {
    const selectedSubjects = selectedSubjectsForBulkAction;
    let successCount = 0;
    let failedCount = 0;

    try {
      switch (actionType) {
        case 'status_update':
          for (const subject of selectedSubjects) {
            try {
              await subjectsApi.updateSubject(subject.subjectId.toString(), { status: config.status });
              successCount++;
            } catch (error) {
              console.error(`Failed to update status for subject ${subject.subjectName}:`, error);
              failedCount++;
            }
          }
          break;
        case 'archive':
          for (const subject of selectedSubjects) {
            try {
              await subjectsApi.updateSubject(subject.subjectId.toString(), { status: 'ARCHIVED' });
              successCount++;
            } catch (error) {
              console.error(`Failed to archive subject ${subject.subjectName}:`, error);
              failedCount++;
            }
          }
          break;
        case 'restore':
          for (const subject of selectedSubjects) {
            try {
              await subjectsApi.updateSubject(subject.subjectId.toString(), { status: 'ACTIVE' });
              successCount++;
            } catch (error) {
              console.error(`Failed to restore subject ${subject.subjectName}:`, error);
              failedCount++;
            }
          }
          break;
        case 'export':
          // Handle export logic
          const exportData = selectedSubjects.map(subject => ({
            name: subject.subjectName,
            code: subject.subjectCode,
            type: subject.subjectType,
            units: subject.creditedUnits,
            semester: subject.semester,
            academicYear: subject.academicYear,
            department: subject.department?.departmentName || '',
            status: subject.status
          }));
          
          if (config.format === 'csv') {
            const headers = ['name', 'code', 'type', 'units', 'semester', 'academicYear', 'department', 'status'];
            const csvContent = [
              headers.join(","),
              ...exportData.map(row => headers.map(header => String(row[header as keyof typeof row])).join(","))
            ].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "selected_subjects.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (config.format === 'excel') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Subjects");
            XLSX.writeFile(workbook, "selected_subjects.xlsx");
          }
          successCount = selectedSubjects.length;
          break;
        case 'delete':
          for (const subject of selectedSubjects) {
            try {
              await subjectsApi.deleteSubject(subject.subjectId.toString());
              successCount++;
            } catch (error) {
              console.error(`Failed to delete subject ${subject.subjectName}:`, error);
              failedCount++;
            }
          }
          break;
        default:
          toast.error(`Unknown action: ${actionType}`);
          return { success: false, processed: 0 };
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      failedCount = selectedSubjects.length;
    }

    handleBulkActionComplete(actionType, { success: successCount > 0, error: failedCount > 0 ? `Failed for ${failedCount} subjects` : null });
    
    return { 
      success: successCount > 0, 
      processed: successCount 
    };
  };

  // Add missing export handler for selected subjects
  const handleExportSelectedSubjects = (selectedSubjects: Subject[]) => {
    if (selectedSubjects.length === 0) {
      toast.error('No subjects selected for export');
      return;
    }
    
    const exportData = selectedSubjects.map(subject => ({
      name: subject.subjectName,
      code: subject.subjectCode,
      type: subject.subjectType,
      units: subject.creditedUnits,
      semester: subject.semester,
      academicYear: subject.academicYear,
      department: subject.department?.departmentName || '',
      status: subject.status
    }));

    const headers = ['Subject Name', 'Code', 'Type', 'Units', 'Semester', 'Academic Year', 'Department', 'Status'];
    const csvContent = [
      headers.join(","),
      ...exportData.map(row => [
        row.name,
        row.code,
        row.type,
        row.units,
        row.semester,
        row.academicYear,
        row.department,
        row.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "selected_subjects.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedSubjects.length} subjects to CSV`);
  };

  // Add bulk deactivate handler
  const handleBulkArchive = async () => {
    const selectedSubjects = subjects.filter(s => s.subjectId && selectedIds.includes(s.subjectId.toString()));
    if (selectedSubjects.length === 0) {
      toast.error('No subjects selected for archiving');
      return;
    }

    try {
      let successCount = 0;
      for (const subject of selectedSubjects) {
        try {
          await subjectsApi.updateSubject(subject.subjectId.toString(), { status: 'ARCHIVED' });
          successCount++;
        } catch (error) {
          console.error(`Failed to archive subject ${subject.subjectName}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully archived ${successCount} subjects`);
        refreshSubjects();
      } else {
        toast.error('Failed to archive any subjects');
      }
    } catch (error) {
      console.error('Bulk archive error:', error);
      toast.error('Failed to archive subjects');
    }
  };

  // Add bulk restore handler
  const handleBulkRestore = async () => {
    const selectedSubjects = subjects.filter(s => s.subjectId && selectedIds.includes(s.subjectId.toString()));
    if (selectedSubjects.length === 0) {
      toast.error('No subjects selected for restoration');
      return;
    }

    try {
      let successCount = 0;
      for (const subject of selectedSubjects) {
        try {
          await subjectsApi.updateSubject(subject.subjectId.toString(), { status: 'ACTIVE' });
          successCount++;
        } catch (error) {
          console.error(`Failed to restore subject ${subject.subjectName}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully restored ${successCount} subjects`);
        refreshSubjects();
      } else {
        toast.error('Failed to restore any subjects');
      }
    } catch (error) {
      console.error('Bulk restore error:', error);
      toast.error('Failed to restore subjects');
    }
  };

  // Add bulk delete handler
  const handleBulkDelete = async () => {
    const selectedSubjects = subjects.filter(s => s.subjectId && selectedIds.includes(s.subjectId.toString()));
    if (selectedSubjects.length === 0) {
      toast.error('No subjects selected for deletion');
      return;
    }

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to permanently delete ${selectedSubjects.length} subjects? This action cannot be undone.`)) {
      return;
    }

    try {
      let successCount = 0;
      let failedCount = 0;
      
      for (const subject of selectedSubjects) {
        try {
          await subjectsApi.deleteSubject(subject.subjectId.toString());
          successCount++;
        } catch (error) {
          console.error(`Failed to delete subject ${subject.subjectName}:`, error);
          failedCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} subjects`);
        if (failedCount > 0) {
          toast.warning(`${failedCount} subjects failed to delete`);
        }
        refreshSubjects();
        setSelectedIds([]); // Clear selection after deletion
      } else {
        toast.error('Failed to delete any subjects');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete subjects');
    }
  };

  // Get selected subjects for bulk actions
  const selectedSubjectsForBulkActions = subjects.filter(s => s.subjectId && selectedIds.includes(s.subjectId.toString()));

  const columns: TableListColumn<Subject>[] = [
    {
      header: '',
      accessor: 'expander',
      className: 'w-10 text-center px-1 py-1',
      expandedContent: (item: Subject) => {
        // Enhanced data preparation for quick insights
        const description = item.description || 'No description available';
        const instructors = item.instructors && item.instructors.length > 0 
          ? item.instructors.map(i => `${i.firstName} ${i.lastName}`) 
          : ['No instructors assigned'];
        const totalUnits = item.creditedUnits || 0;
        const lectureUnits = item.lectureUnits || 0;
        const labUnits = item.labUnits || 0;
        const prerequisites = item.prerequisites ? item.prerequisites.split(',').map(p => p.trim()).filter(Boolean) : [];
        const departmentName = item.department?.departmentName || 'Unknown Department';
        const academicYear = item.academicYear || 'Not specified';
        const maxStudents = item.maxStudents || 30;
        const totalHours = item.totalHours || (totalUnits * 18);

        // Calculate some quick metrics (placeholder for now)
        const enrollmentRate = Math.floor(Math.random() * 100); // This would come from real data
        const isOverEnrolled = enrollmentRate > 90;
        const isUnderEnrolled = enrollmentRate < 30;
        const hasPrerequisites = prerequisites.length > 0;
        const hasInstructors = instructors.length > 0 && instructors[0] !== 'No instructors assigned';

        return (
          <td colSpan={subjectColumns.length + 2} className="p-0">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-t-2 border-blue-200 p-4 animate-in slide-in-from-top-2 duration-300">
              
              {/* Header with subject info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.subjectName}</h3>
                    <p className="text-sm text-gray-600">{item.subjectCode} • {departmentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(item.status)} className="px-2 py-1">
                    {item.status}
                  </Badge>
                  <Badge variant="outline" className="px-2 py-1 border-blue-300 text-blue-700">
                    {item.subjectType}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="flex items-center justify-between mb-4 p-3 bg-white/70 rounded-lg border border-blue-100">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-900">{totalUnits}</div>
                    <div className="text-xs text-gray-600">Total Units</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{totalHours}</div>
                    <div className="text-xs text-gray-600">Total Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">{maxStudents}</div>
                    <div className="text-xs text-gray-600">Max Students</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${isOverEnrolled ? 'text-red-600' : isUnderEnrolled ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {enrollmentRate}%
                    </div>
                    <div className="text-xs text-gray-600">Enrollment</div>
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="flex items-center gap-2">
                  {isOverEnrolled && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Over-enrolled
                    </Badge>
                  )}
                  {isUnderEnrolled && (
                    <Badge variant="secondary" className="text-xs">
                      <Info className="w-3 h-3 mr-1" />
                      Low enrollment
                    </Badge>
                  )}
                  {!hasInstructors && (
                    <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                      <User className="w-3 h-3 mr-1" />
                      No instructors
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tabbed Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Description */}
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Description
                  </h4>
                  <p className="text-sm text-gray-700">{description}</p>
                </div>

                {/* Instructors */}
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Instructors ({instructors.length})
                  </h4>
                  <div className="space-y-1">
                    {instructors.map((instructor, idx) => (
                      <div key={idx} className="text-sm text-gray-700 bg-blue-50 px-2 py-1 rounded">
                        {instructor}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Prerequisites ({prerequisites.length})
                  </h4>
                  <div className="space-y-1">
                    {hasPrerequisites ? (
                      prerequisites.map((prereq, idx) => (
                        <div key={idx} className="text-sm text-gray-700 bg-yellow-50 px-2 py-1 rounded">
                          {prereq}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No prerequisites required</div>
                    )}
                  </div>
                </div>

                {/* Units Breakdown */}
                <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Units Breakdown
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Units:</span>
                      <span className="font-medium text-blue-900">{totalUnits}</span>
                    </div>
                    {item.subjectType === 'HYBRID' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lecture Units:</span>
                          <span className="font-medium text-green-600">{lectureUnits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lab Units:</span>
                          <span className="font-medium text-orange-600">{labUnits}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Bar */}
              <div className="flex items-center justify-center p-3 bg-white/70 rounded-lg border border-blue-100 mt-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Subject ID: {item.subjectId}</span>
                  <span>•</span>
                  <span>Department: {departmentName}</span>
                  <span>•</span>
                  <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Last Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </td>
        );
      },
    },
    {
      header: (
        <div className="flex justify-center items-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={el => {
              if (el) el.indeterminate = isIndeterminate;
            }}
            onChange={handleSelectAll}
            aria-label="Select all subjects"
          />
        </div>
      ),
      accessor: 'select',
      className: 'w-10 text-center px-1 py-1',
      render: (item: Subject) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(item.subjectId?.toString() || '')}
          onChange={() => handleSelectRow(item.subjectId?.toString() || '')}
          aria-label={`Select ${item.subjectName}`}
        />
      ),
    },
    ...subjectColumns
      .filter(col => visibleColumns.includes(col.key) && col.key !== 'maxStudents' && col.key !== 'totalHours')
      .map(col => {
      if (col.key === 'subjectName') {
        return {
          header: "Subject Name",
          accessor: col.accessor,
          className: col.className,
          sortable: true,
        };
      }
      if (col.key === 'subjectCode') {
        return {
          header: "Code",
          accessor: col.accessor,
          className: col.className,
          sortable: true,
        };
      }
      if (col.key === 'subjectType') {
        return {
          header: "Type",
          accessor: col.accessor,
          className: 'w-24 min-w-[60px] max-w-[80px] text-center px-1',
          sortable: true,
          render: (item: Subject) => (
            <Badge variant={getTypeBadgeVariant(item.subjectType || '')}>
              {item.subjectType ? item.subjectType.charAt(0).toUpperCase() + item.subjectType.slice(1).toLowerCase() : 'Unknown'}
            </Badge>
          )
        };
      }
      if (col.key === 'creditedUnits') {
        return {
          header: "Credited Units",
          accessor: col.accessor,
          className: 'w-24 min-w-[60px] max-w-[80px] text-center px-1',
          sortable: true,
          render: (item: Subject) => (
            item.creditedUnits
          )
        };
      }
      if (col.key === 'prerequisites') {
        return {
          header: "Prerequisites",
          accessor: 'prerequisites',
          className: 'min-w-[120px] max-w-[200px] text-center px-2',
          sortable: false,
          render: (item: Subject) => (
            Array.isArray(item.prerequisites) && item.prerequisites.length > 0
              ? item.prerequisites.map((p: any) => p.subjectCode || p).join(', ')
              : 'None'
          )
        };
      }
      if (col.key === 'semester') {
        return {
          header: "Semester",
          accessor: col.accessor,
          className: col.className,
          sortable: true,
        };
      }
      if (col.key === 'academicYear') {
        return {
          header: "Academic Year",
          accessor: col.accessor,
          className: col.className,
          sortable: true,
          render: (item: Subject) => (
            item.academicYear || ''
          )
        };
      }
      if (col.key === 'department') {
        return {
          header: "Department",
          accessor: col.accessor,
          className: col.className,
          sortable: true,
          render: (item: Subject) => (
            item.department?.departmentName || ''
          )
        };
      }
      if (col.key === 'status') {
        return {
          header: "Status",
          accessor: col.accessor,
          className: col.className,
          sortable: true,
          render: (item: Subject) => (
            <Badge variant={getStatusBadgeVariant(item.status || '')}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase() : 'Unknown'}
            </Badge>
          )
        };
      }
      // Handle department column in fallback case
      if (col.key === 'department') {
        return {
          header: "Department",
          accessor: col.accessor,
          className: col.className,
          sortable: true,
          render: (item: Subject) => (
            item.department?.departmentName || ''
          )
        };
      }
      return {
        header: col.label,
        accessor: col.accessor,
        className: col.className
      };
    }).filter(Boolean),
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      render: (item: Subject) => (
        <TableRowActions
          onView={() => { setSelectedSubject(item); setViewDialogOpen(true); }}
          onEdit={() => { setModalSubject(item); setModalOpen(true); }}
          onDelete={() => handleDeleteClick(item)}
          itemName={item.subjectName}
          viewAriaLabel={`View subject ${item.subjectName}`}
          editAriaLabel={`Edit subject ${item.subjectName}`}
          deleteAriaLabel={`Delete subject ${item.subjectName}`}
        />
      )
    },
  ];

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [lastActionTime, setLastActionTime] = useState('2 minutes ago');
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<{ id: string; name: string; code: string }[]>([]);

  useEffect(() => {
    // Fetch department options on mount
    departmentsApi.fetchDepartments()
      .then(setDepartmentOptions)
      .catch(() => setDepartmentOptions([]));
  }, []);

  const checkSubjectDeletable = async (subject: Subject) => {
    try {
      const result = await subjectsApi.checkSubjectDeletable(subject.subjectId.toString());
      setCanDelete(result.canDelete);
      if (!result.canDelete && result.details) {
        let message = "This subject cannot be deleted because it has:";
        if (result.details.hasSchedules) message += "\n• Active schedules";
        if (result.details.hasAnnouncements) message += "\n• Related announcements";
        if (result.details.hasInstructors) message += "\n• Assigned instructors";
        if (result.details.hasEnrolledStudents) message += "\n• Enrolled students";
        setDeleteError(message);
      } else {
        setDeleteError(null);
      }
    } catch (error) {
      console.error("Error checking subject status:", error);
      setCanDelete(false);
      setDeleteError("Failed to check if subject can be deleted");
    }
  };

  const handleDeleteClick = (subject: Subject) => {
    setSubjectToDelete(subject);
    setDeleteDialogOpen(true);
    checkSubjectDeletable(subject);
  };

  // Handler for importing subjects
  const handleImportSubjects = async (data: any[]) => {
    try {
      const response = await fetch('/api/subjects/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: data,
          options: {
            skipDuplicates: true,
            updateExisting: false,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import subjects');
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.results.success} subjects`);
      
      if (result.results.failed > 0) {
        toast.warning(`${result.results.failed} subjects failed to import`);
      }
      
      if (result.results.duplicates > 0) {
        toast.info(`${result.results.duplicates} duplicate subjects skipped`);
      }

      setImportDialogOpen(false);
      refreshSubjects();
      
      return {
        success: result.results.success,
        failed: result.results.failed,
        errors: result.results.errors
      };
    } catch (error: any) {
      console.error('Error importing subjects:', error);
      toast.error(error.message || 'Failed to import subjects');
      return {
        success: 0,
        failed: data.length,
        errors: [error.message || 'Unknown error']
      };
    }
  };

  // --- Step 1: Page Structure & Header ---
  // Calculate summary card values
  const totalSubjectsCount = subjects.length;
  const activeSubjectsCount = subjects.filter(s => s.status === 'ACTIVE').length;
  const inactiveSubjectsCount = subjects.filter(s => s.status === 'INACTIVE').length;
  const totalUnitsCount = subjects.reduce((sum, s) => sum + (s.creditedUnits || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Subjects"
          subtitle="Manage academic subjects and curriculum"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Academic Management", href: "/academic-management" },
            { label: "Subjects" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<BookOpen className="text-blue-700 w-5 h-5" />}
            label="Total Subjects"
            value={totalSubjectsCount}
            valueClassName="text-blue-900"
            sublabel="Registered subjects"
            loading={loading}
          />
          <SummaryCard
            icon={<CheckCircle className="text-blue-600 w-5 h-5" />}
            label="Active Subjects"
            value={activeSubjectsCount}
            valueClassName="text-blue-900"
            sublabel="Currently active"
            loading={loading}
          />
          <SummaryCard
            icon={<XCircle className="text-blue-600 w-5 h-5" />}
            label="Inactive Subjects"
            value={inactiveSubjectsCount}
            valueClassName="text-blue-900"
            sublabel="Inactive/archived"
            loading={loading}
          />
          <SummaryCard
            icon={<Calculator className="text-blue-600 w-5 h-5" />}
            label="Total Units"
            value={totalUnitsCount}
            valueClassName="text-blue-900"
            sublabel="Sum of all units"
            loading={loading}
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
                id: 'add-subject',
                label: 'Add Subject',
                description: 'Create new subject',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => { setModalSubject(undefined); setModalOpen(true); }
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import subjects from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print subjects list',
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
                description: 'Reload subject data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: refreshSubjects,
                disabled: isRefreshing,
                loading: isRefreshing
              },
              {
                id: 'sort-options',
                label: 'Sort Options',
                description: 'Configure sorting',
                icon: <List className="w-5 h-5 text-white" />,
                onClick: () => setSortDialogOpen(true)
              },
            ]}
            lastActionTime={lastActionTime}
            onLastActionTimeChange={setLastActionTime}
            collapsible={true}
            defaultCollapsed={true}
            onCollapseChange={(collapsed) => {
              // Optionally handle collapse state
            }}
          />
        </div>

        {/* Card layout for subject list, header, search/filter, and table */}
        {!loading && !error && (
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full mt-6">
            <CardHeader className="p-0">
              {/* Blue Gradient Header - flush to card edge, no rounded corners */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">Subject List</div>
                      <div className="text-white text-sm">Search and filter subject information</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search and Filter Section */}
              <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6 bg-white rounded-t-xl">
                <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-end">
                  {/* Search Bar */}
                  <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    />
                  </div>
                  {/* Quick Filter Dropdowns */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-500 placeholder:text-gray-400 border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.type} onValueChange={v => setFilters(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-500 placeholder:text-gray-400 border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="laboratory">Laboratory</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.semester} onValueChange={v => setFilters(f => ({ ...f, semester: v }))}>
                      <SelectTrigger className="w-full sm:w-36 lg:w-40 xl:w-36 text-gray-500 placeholder:text-gray-400 border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="All Semesters" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        <SelectItem value="1">1st</SelectItem>
                        <SelectItem value="2">2nd</SelectItem>
                        <SelectItem value="3">3rd</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.year_level} onValueChange={v => setFilters(f => ({ ...f, year_level: v }))}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-500 placeholder:text-gray-400 border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="1">1st</SelectItem>
                        <SelectItem value="2">2nd</SelectItem>
                        <SelectItem value="3">3rd</SelectItem>
                        <SelectItem value="4">4th</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.departmentId} onValueChange={v => setFilters(f => ({ ...f, departmentId: v }))}>
                      <SelectTrigger className="w-full sm:w-40 lg:w-44 xl:w-40 text-gray-500 placeholder:text-gray-400 border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 transition-colors">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departmentOptions.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.code || dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {/* Table layout for xl+ only */}
              <div className="hidden xl:block">
                <div className="px-4 sm:px-6 pt-6 pb-6"> {/* Add top and bottom padding around the table */}
                  <div className="overflow-x-auto bg-white/70 shadow-none relative"> {/* border and border-blue-100 removed */}
                    {/* Loader overlay when refreshing */}
                    {isRefreshing && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                      </div>
                    )}
                    <div className="print-content">
                      {selectedIds.length > 0 && (
                        <BulkActionsBar
                          selectedCount={selectedIds.length}
                          entityLabel="subject"
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
                              onClick: () => handleExportSelectedSubjects(selectedSubjectsForBulkActions),
                              tooltip: "Quick export selected subjects to CSV"
                            },
                            {
                              key: "archive",
                              label: "Archive Selected",
                              icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />,
                              onClick: handleBulkArchive,
                              loading: loading,
                              disabled: loading || selectedSubjectsForBulkActions.every(s => s.status === "ARCHIVED"),
                              tooltip: "Archive selected subjects (can be restored later)",
                              variant: "destructive",
                              hidden: selectedSubjectsForBulkActions.length === 0 || selectedSubjectsForBulkActions.every(s => s.status === "ARCHIVED")
                            },
                            {
                              key: "restore",
                              label: "Restore Selected",
                              icon: loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />,
                              onClick: handleBulkRestore,
                              loading: loading,
                              disabled: loading || selectedSubjectsForBulkActions.every(s => s.status !== "ARCHIVED"),
                              tooltip: "Restore selected archived subjects",
                              variant: "default",
                              hidden: selectedSubjectsForBulkActions.length === 0 || selectedSubjectsForBulkActions.every(s => s.status !== "ARCHIVED")
                            },
                            {
                              key: "delete",
                              label: "Delete Selected",
                              icon: loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                              onClick: handleBulkDelete,
                              loading: loading,
                              disabled: loading,
                              tooltip: "Permanently delete selected subjects (cannot be undone)",
                              variant: "destructive",
                              hidden: selectedSubjectsForBulkActions.length === 0 || selectedSubjectsForBulkActions.some(s => s.status === "ACTIVE")
                            }
                          ]}
                          onClear={() => setSelectedIds([])}
                          className="mb-4"
                        />
                      )}
                      <TableList
                        columns={columns}
                        data={paginatedSubjects || []}
                        loading={loading}
                        getItemId={(item) => {
                          if (item.subjectId) return item.subjectId.toString();
                          if (item.subjectName && item.subjectCode) {
                            return `subject-${item.subjectName.replace(/\s+/g, '-').toLowerCase()}-${item.subjectCode}`;
                          }
                          if (item.subjectName) {
                            return `subject-${item.subjectName.replace(/\s+/g, '-').toLowerCase()}`;
                          }
                          if (item.subjectCode) {
                            return `subject-${item.subjectCode}`;
                          }
                          return `subject-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        }}
                        expandedRowIds={expandedRowIds}
                        onToggleExpand={(itemId) => {
                          setExpandedRowIds(current =>
                            current.includes(itemId)
                              ? current.filter(id => id !== itemId)
                              : [...current, itemId]
                          );
                        }}
                        selectedIds={selectedIds}
                        onSelectRow={handleSelectRow}
                        onSelectAll={handleSelectAll}
                        isAllSelected={isAllSelected}
                        isIndeterminate={isIndeterminate}
                        sortState={{ field: sortField, order: sortOrder }}
                        onSort={(accessor) => handleSort(accessor as SortField)}
                        className="border-0 shadow-none max-w-full"
                        emptyMessage={<div className="flex flex-col items-center justify-center py-8 px-4">
                          <EmptyState
                            icon={<BadgeInfo className="w-6 h-6 text-blue-400" />}
                            title="No subjects found"
                            description="Try adjusting your search criteria or filters to find the subjects you're looking for."
                            action={<div className="flex flex-col gap-2 w-full">
                              <Button
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded"
                                onClick={refreshSubjects}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Data
                              </Button>
                            </div>}
                          />
                        </div>}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Card layout for small screens */}
              <div className="block xl:hidden p-2 sm:p-3 lg:p-4 max-w-full">
                <div className="px-2 sm:px-4 pt-6 pb-6"> {/* Add top and bottom padding for mobile card view */}
                  {(paginatedSubjects || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<BadgeInfo className="w-6 h-6 text-blue-400" />}
                        title="No subjects found"
                        description="Try adjusting your search criteria or filters to find the subjects you're looking for."
                        action={<div className="flex flex-col gap-2 w-full">
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded"
                            onClick={refreshSubjects}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                          </Button>
                        </div>}
                      />
                    </div>
                  ) : (
                    <TableCardView
                      items={paginatedSubjects || []}
                      selectedIds={selectedIds}
                      onSelect={handleSelectRow}
                      onView={(item) => {
                        setSelectedSubject(item);
                        setViewDialogOpen(true);
                      }}
                      onEdit={(item) => {
                        setModalSubject(item);
                        setModalOpen(true);
                      }}
                      onDelete={(item) => {
                        setSubjectToDelete(item);
                        setDeleteDialogOpen(true);
                      }}
                      getItemId={(item) => {
                        if (item.subjectId) return item.subjectId.toString();
                        if (item.subjectName && item.subjectCode) {
                          return `subject-${item.subjectName.replace(/\s+/g, '-').toLowerCase()}-${item.subjectCode}`;
                        }
                        if (item.subjectName) {
                          return `subject-${item.subjectName.replace(/\s+/g, '-').toLowerCase()}`;
                        }
                        if (item.subjectCode) {
                          return `subject-${item.subjectCode}`;
                        }
                        return `subject-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                      }}
                      getItemName={(item) => item.subjectName}
                      getItemCode={(item) => item.subjectCode}
                      getItemStatus={(item) => item.status.toLowerCase() as 'active' | 'inactive'}
                      getItemDescription={(item) => item.description}
                      getItemDetails={(item) => [
                        { label: 'Type', value: item.subjectType },
                        { label: 'Units', value: item.creditedUnits },
                        { label: 'Semester', value: item.semester },
                        { label: 'Academic Year', value: item.academicYear },
                        { label: 'Department', value: item.department?.departmentName || '' },
                      ]}
                      isLoading={loading}
                    />
                  )}
                </div>
              </div>
              {/* Pagination for both views */}
                <TablePagination
                  page={currentPage}
                  pageSize={itemsPerPage}
                  totalItems={totalSubjects}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setItemsPerPage}
                  pageSizeOptions={[10, 25, 50, 100]}
                  loading={loading}
                  entityLabel="subject"
                />
            </CardContent>
          </Card>
        )}



        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={handleExport}
          dataCount={subjects.length}
          entityType="student"
        />

        {/* Sort Dialog */}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortOptions={[
            { value: 'subjectName', label: 'Subject Name' },
            { value: 'subjectCode', label: 'Subject Code' },
            { value: 'subjectType', label: 'Type' },
            { value: 'creditedUnits', label: 'Units' },
            { value: 'semester', label: 'Semester' },
            { value: 'academicYear', label: 'Academic Year' },
            { value: 'department', label: 'Department' },
          ]}
          currentSort={{ field: sortField, order: sortOrder }}
          onSortChange={(field: string, order: 'asc' | 'desc') => {
            setSortField(field as SortField);
            setSortOrder(order as SortOrder);
            setSortFields([{ field: field as SortField, order }]);
          }}
          title="Sort Subjects"
          description="Sort subjects by different fields. Choose the field and order to organize your list."
          entityType="subjects"
        />

        {/* Visible Columns Dialog */}
        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={COLUMN_OPTIONS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onReset={handleResetColumns}
          title="Manage Subject Columns"
          description="Choose which columns to display in the subject table"
          searchPlaceholder="Search subject columns..."
          enableManualSelection={true}
          onManualSelectionChange={(state) => {
            // Optionally handle manual selection state
          }}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={open => {
            if (!open) {
              setDeleteDialogOpen(false);
              setSubjectToDelete(null);
              setCanDelete(true);
              setDeleteError(null);
            }
          }}
          itemName={subjectToDelete?.subjectName}
          onDelete={() => subjectToDelete && handleDeleteSubject(subjectToDelete.subjectId.toString())}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setSubjectToDelete(null);
            setCanDelete(true);
            setDeleteError(null);
          }}
          canDelete={canDelete}
          deleteError={deleteError}
        />

        {/* Subject Form Modal */}
        <SubjectFormDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          type={modalSubject ? "update" : "create"}
          data={modalSubject}
          id={modalSubject?.subjectId?.toString()}
          onSuccess={() => {
            setModalOpen(false);
            refreshSubjects();
          }}
        />

        {/* View Dialog */}
        <ViewDialog
          open={viewDialogOpen}
          onOpenChange={(open: boolean) => {
            setViewDialogOpen(open);
            if (!open) setSelectedSubject(null);
          }}
          title={selectedSubject?.subjectName || ''}
          subtitle={selectedSubject?.subjectCode}
          status={selectedSubject ? {
            value: selectedSubject.status,
            variant: getStatusBadgeVariant(selectedSubject.status)
          } : undefined}
          sections={[
            {
              title: "Basic Information",
              fields: [
                { label: 'Subject Code', value: selectedSubject?.subjectCode || '', type: 'text' },
                { label: 'Subject Type', value: selectedSubject?.subjectType || '', type: 'badge', badgeVariant: getTypeBadgeVariant(selectedSubject?.subjectType || '') },
                { label: 'Department', value: selectedSubject?.department?.departmentName || '', type: 'text' },
                { label: 'Course', value: selectedSubject?.course?.courseName || 'Not assigned', type: 'text' },
                { label: 'Status', value: selectedSubject?.status || '', type: 'badge', badgeVariant: getStatusBadgeVariant(selectedSubject?.status || '') },
                { label: 'Subject ID', value: selectedSubject?.subjectId || '', type: 'text' },
              ],
              columns: 2
            },
            {
              title: "Units & Hours",
              fields: [
                { label: 'Total Units', value: selectedSubject?.creditedUnits || 0, type: 'number' as const },
                { label: 'Total Hours', value: selectedSubject?.totalHours || 0, type: 'number' as const },
                ...(selectedSubject?.subjectType === "HYBRID" ? [
                  { label: 'Lecture Units', value: selectedSubject?.lectureUnits || 0, type: 'number' as const },
                  { label: 'Laboratory Units', value: selectedSubject?.labUnits || 0, type: 'number' as const }
                ] : []),
                { label: 'Hours per Unit', value: selectedSubject?.totalHours && selectedSubject?.creditedUnits ? Math.round(selectedSubject.totalHours / selectedSubject.creditedUnits) : 18, type: 'number' as const },
              ],
              columns: 2
            },
            {
              title: "Schedule & Capacity",
              fields: [
                { label: 'Semester', value: selectedSubject?.semester === 'FIRST_SEMESTER' ? '1st Semester' : 
                                         selectedSubject?.semester === 'SECOND_SEMESTER' ? '2nd Semester' : 
                                         selectedSubject?.semester === 'THIRD_SEMESTER' ? '3rd Semester' : '', type: 'text' },
                { label: 'Academic Year', value: selectedSubject?.academicYear || '', type: 'text' },
                { label: 'Maximum Students', value: selectedSubject?.maxStudents || 30, type: 'number' as const },
                { label: 'Current Enrollment', value: Math.floor(Math.random() * (selectedSubject?.maxStudents || 30)), type: 'number' as const },
              ],
              columns: 2
            },
            {
              title: "Instructors",
              fields: selectedSubject?.instructors && selectedSubject.instructors.length > 0 
                ? selectedSubject.instructors.map((instructor, index) => ({
                    label: `Instructor ${index + 1}`,
                    value: `${instructor.firstName} ${instructor.lastName} (${instructor.email})`,
                type: 'text'
                  }))
                : [{ label: 'Instructors', value: 'No instructors assigned', type: 'text' }]
            },
            {
              title: "Prerequisites",
              fields: selectedSubject?.prerequisites 
                ? selectedSubject.prerequisites.split(',').map((prereq, index) => ({
                    label: `Prerequisite ${index + 1}`,
                    value: prereq.trim(),
                    type: 'text'
                  }))
                : [{ label: 'Prerequisites', value: 'No prerequisites required', type: 'text' }]
            },
            {
              title: "Description",
              fields: [
                { label: 'Full Description', value: selectedSubject?.description || 'No description provided', type: 'text' }
              ],
              columns: 1
            },
            {
              title: "System Information",
              fields: [
                { label: 'Created Date', value: selectedSubject?.createdAt ? new Date(selectedSubject.createdAt).toLocaleString() : '', type: 'text' },
                { label: 'Last Updated', value: selectedSubject?.updatedAt ? new Date(selectedSubject.updatedAt).toLocaleString() : '', type: 'text' },
                { label: 'Course ID', value: selectedSubject?.courseId || '', type: 'text' },
                { label: 'Department ID', value: selectedSubject?.departmentId || '', type: 'text' },
              ],
              columns: 2
            },
          ]}
          description={`Comprehensive details for ${selectedSubject?.subjectName || 'this subject'}`}
          tooltipText="View complete subject information and metadata"
        />

        {/* Import Dialog */}
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImportSubjects}
          entityName="Subjects"
          templateUrl="/api/subjects/template"
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={5}
          fileRequirements={
            <>
              <li>• File must be in CSV or Excel format</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Required columns: <b>subjectName</b>, <b>subjectCode</b>, <b>subjectType</b>, <b>courseId</b>, <b>departmentId</b>, <b>academicYear</b>, <b>semester</b>, <b>totalHours</b></li>
              <li>• Optional columns: <b>description</b>, <b>lectureUnits</b>, <b>labUnits</b>, <b>creditedUnits</b>, <b>prerequisites</b>, <b>maxStudents</b>, <b>status</b></li>
              <li>• <b>subjectName</b>: Full subject name (e.g., "Introduction to Programming")</li>
              <li>• <b>subjectCode</b>: Must be unique (e.g., "CS101", "MATH201")</li>
              <li>• <b>subjectType</b> values: "LECTURE", "LABORATORY", "HYBRID", "THESIS", "RESEARCH", "INTERNSHIP"</li>
              <li>• <b>courseId</b>: Must match an existing course ID in the system</li>
              <li>• <b>departmentId</b>: Must match an existing department ID in the system</li>
              <li>• <b>academicYear</b>: Academic year (e.g., "2024-2025")</li>
              <li>• <b>semester</b> values: "FIRST_SEMESTER", "SECOND_SEMESTER", "THIRD_SEMESTER"</li>
              <li>• <b>totalHours</b>: Must be a positive number</li>
              <li>• <b>status</b> values: "ACTIVE", "INACTIVE", "ARCHIVED", "PENDING_REVIEW" (defaults to "ACTIVE")</li>
              <li>• <b>lectureUnits</b> and <b>labUnits</b>: Required for HYBRID subjects</li>
              <li>• <b>creditedUnits</b>: Total credit units (defaults to lectureUnits + labUnits if not specified)</li>
            </>
          }
        />

        {/* Bulk Actions Dialog */}
        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={selectedSubjectsForBulkAction}
          entityType="subject"
          entityLabel="subjects"
          availableActions={[
            {
              id: 'status-update',
              tabId: 'status',
              label: 'Update Status',
              description: 'Change the status of selected subjects',
              icon: <Settings className="w-4 h-4" />,
              requiresConfirmation: true,
              confirmationMessage: 'Are you sure you want to update the status of the selected subjects?'
            },
            {
              id: 'export',
              tabId: 'export',
              label: 'Export Selected',
              description: 'Export selected subjects to a file',
              icon: <Download className="w-4 h-4" />
            }
          ]}
          onActionComplete={handleBulkActionComplete}
          onCancel={handleBulkActionCancel}
          onProcessAction={handleProcessBulkAction}
          getItemDisplayName={(item: Subject) => item.subjectName}
          getItemStatus={(item: Subject) => item.status}
          getItemId={(item: Subject) => item.subjectId?.toString() || ''}
        />
      </div>
    </div>
  );
}
