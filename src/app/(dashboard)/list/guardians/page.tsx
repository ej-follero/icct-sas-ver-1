"use client";

import { useState, useEffect, useMemo } from "react";
import { PageSkeleton } from "@/components/reusable/Skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { GuardianForm } from "@/components/forms/GuardianForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import Fuse from "fuse.js";
import React from "react";
import { Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, UserCheck, UserX, Users, UserPlus, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, Hash, Tag, Layers, FileText, Clock, Info, UserCheck as UserCheckIcon, Archive, Shield, Mail, Phone, Key, Calendar, Activity, AlertTriangle, CheckCircle, MapPin, Briefcase } from "lucide-react";
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
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { SummaryCardSkeleton } from '@/components/reusable/Skeleton';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { Pagination } from "@/components/Pagination";
import { TableHeaderSection } from '@/components/reusable/Table/TableHeaderSection';
import { useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Guardian {
  guardianId: number;
  email: string;
  phoneNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  address: string;
  img?: string;
  gender: 'MALE' | 'FEMALE';
  guardianType: 'PARENT' | 'GUARDIAN';
  occupation?: string;
  workplace?: string;
  emergencyContact?: string;
  relationshipToStudent: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalStudents: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  Student?: Array<{
    studentId: number;
    studentIdNum: string;
    firstName: string;
    lastName: string;
    email: string;
    CourseOffering?: {
      courseName: string;
      courseCode: string;
    };
  }>;
}

const ITEMS_PER_PAGE = 10;

interface ColumnFilter {
  field: string;
  value: string;
}

type MultiSortField = { field: string; order: 'asc' | 'desc' };

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

// Centralized guardian columns definition
const guardianColumns = [
  { key: 'firstName', label: 'First Name', accessor: 'firstName', className: 'text-blue-900 w-20', sortable: true },
  { key: 'lastName', label: 'Last Name', accessor: 'lastName', className: 'text-blue-900 w-20', sortable: true },
  { key: 'email', label: 'Email', accessor: 'email', className: 'text-blue-900 w-24', sortable: true },
  { key: 'phoneNumber', label: 'Phone', accessor: 'phoneNumber', className: 'text-blue-900 w-20', sortable: true },
  { key: 'guardianType', label: 'Type', accessor: 'guardianType', className: 'text-center text-blue-900 w-16', sortable: true },
  { key: 'status', label: 'Status', accessor: 'status', className: 'text-center w-16', sortable: true },
  { key: 'totalStudents', label: 'Students', accessor: 'totalStudents', className: 'text-center text-blue-900 w-16', sortable: true },
  { key: 'createdAt', label: 'Created', accessor: 'createdAt', className: 'text-center text-blue-900 w-20', sortable: true },
];

// Use accessor/label for TableHeaderSection compatibility
const exportableColumns: { accessor: string; label: string }[] = guardianColumns.map((col) => ({ accessor: col.key, label: col.label }));

// Define column options for visible columns dialog
const COLUMN_OPTIONS: ColumnOption[] = guardianColumns.map(col => ({
  accessor: typeof col.accessor === 'string' ? col.accessor : col.key,
  header: col.label,
  description: col.key === 'totalStudents' ? 'Number of students under this guardian' : undefined,
  category: col.key === 'totalStudents' ? 'Student Info' : 'Guardian Info',
  required: col.key === 'firstName' || col.key === 'lastName', // Always show name
}));

export default function GuardiansListPage() {
  const router = useRouter();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Debounced search input for better performance
  const debouncedSearchInput = useDebounce(searchInput, 300);
  const [sortField, setSortField] = useState<string>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [sortFields, setSortFields] = useState<MultiSortField[]>([
    { field: 'firstName', order: 'asc' }
  ]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(guardianColumns.map(col => col.key));
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [selectedGuardiansForBulkAction, setSelectedGuardiansForBulkAction] = useState<Guardian[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGuardian, setModalGuardian] = useState<Guardian | undefined>();
  const [viewGuardian, setViewGuardian] = useState<Guardian | undefined>();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guardianToDelete, setGuardianToDelete] = useState<{ id: string; name: string } | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isBulkDeactivating, setIsBulkDeactivating] = useState(false);
  const [isBulkReactivating, setIsBulkReactivating] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleteData, setBulkDeleteData] = useState<{
    guardians: Guardian[];
    excludedGuardians: Guardian[];
    message: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [bulkReactivateConfirmOpen, setBulkReactivateConfirmOpen] = useState(false);
  const [bulkReactivateData, setBulkReactivateData] = useState<{
    guardians: Guardian[];
    excludedGuardians: Guardian[];
    message: string;
  } | null>(null);

  // Helper Functions
  const highlightMatch = (text: string, matches: readonly [number, number][] | undefined) => {
    if (!matches || matches.length === 0) return text;
    let result = '';
    let lastIndex = 0;
    matches.forEach(([start, end], i) => {
      result += text.slice(lastIndex, start);
      result += `<mark class='bg-yellow-200 text-yellow-900 rounded px-1 font-medium'>${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });
    result += text.slice(lastIndex);
    return result;
  };

  // Enhanced search highlighting with case-insensitive matching
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 rounded px-1 font-medium">$1</mark>');
  };

  // Add Fuse.js setup with proper types and improved configuration
  const fuse = useMemo(() => new Fuse<Guardian>(guardians, {
    keys: [
      { name: "firstName", weight: 0.25 },
      { name: "lastName", weight: 0.25 },
      { name: "email", weight: 0.2 },
      { name: "phoneNumber", weight: 0.15 },
      { name: "guardianType", weight: 0.1 },
      { name: "relationshipToStudent", weight: 0.05 }
    ],
    threshold: 0.6, // More lenient threshold for better search results
    includeMatches: true,
    ignoreLocation: true, // Search anywhere in the string
    findAllMatches: true, // Find all matches, not just the first one
    minMatchCharLength: 1, // Allow single character matches
  }), [guardians]);

  const fuzzyResults = useMemo(() => {
    if (!debouncedSearchInput.trim()) {
      return guardians.map((g: Guardian, i: number) => ({ item: g, refIndex: i }));
    }
    return fuse.search(debouncedSearchInput) as FuseResult<Guardian>[];
  }, [debouncedSearchInput, fuse, guardians]);

  // Update filtered guardians to include column filters and status filter
  const filteredGuardians = useMemo(() => {
    let filtered = fuzzyResults.map((r: FuseResult<Guardian>) => r.item);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(guardian => guardian.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(guardian => guardian.guardianType === typeFilter);
    }

    // Apply column filters
    if (columnFilters.length > 0) {
      filtered = filtered.filter(guardian => {
        return columnFilters.every(filter => {
          const value = guardian[filter.field as keyof Guardian]?.toString().toLowerCase() || '';
          return value.includes(filter.value.toLowerCase());
        });
      });
    }

    // Apply multi-sort
    if (sortFields.length > 0) {
      filtered.sort((a, b) => {
        for (const { field, order } of sortFields) {
          let aValue, bValue;
          
          aValue = a[field as keyof Guardian];
          bValue = b[field as keyof Guardian];
          
          if (aValue === bValue) continue;
          
          const comparison = (aValue || '') < (bValue || '') ? -1 : 1;
          return order === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [fuzzyResults, columnFilters, statusFilter, typeFilter, sortFields]);

  // Add pagination
  const paginatedGuardians = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredGuardians.slice(start, end);
  }, [filteredGuardians, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredGuardians.length / itemsPerPage);

  const isAllSelected = paginatedGuardians.length > 0 && paginatedGuardians.every(g => selectedIds.includes(g.guardianId.toString()));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedGuardians.map(g => g.guardianId.toString()));
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
    setVisibleColumns(guardianColumns.map(col => col.key));
    toast.success('Column visibility reset to default');
  };

  // Handle expandable row toggle
  const handleToggleExpand = (guardianId: string) => {
    setExpandedRowIds(prev => 
      prev.includes(guardianId) 
        ? prev.filter(id => id !== guardianId)
        : [...prev, guardianId]
    );
  };

  // Table columns (filtered by visibleColumns)
  const columns: TableListColumn<Guardian>[] = [
    {
      header: "",
      accessor: 'expander',
      className: 'w-8 text-center px-1 py-1',
      expandedContent: (item: Guardian) => {
        return (
          <TableExpandedRow
            key={`expanded-${item.guardianId}`}
            colSpan={guardianColumns.filter(col => visibleColumns.includes(col.key)).length + 3}
            headers={["Student Information", "Contact Details"]}
            rows={[
              {
                students: item.Student && item.Student.length > 0 
                  ? item.Student.map(s => `${s.firstName} ${s.lastName} (${s.studentIdNum})`).join(', ')
                  : 'No students assigned',
                contact: `${item.email} • ${item.phoneNumber}`
              }
            ]}
            renderRow={(row: any) => (
              <TableRow key={`row-${item.guardianId}`} className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                <TableCell className="text-left align-top w-1/2 p-4">
                  <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 bg-blue-50 rounded p-2">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <div className="text-sm font-semibold text-blue-900">Student Information</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {row.students}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left align-top w-1/2 p-4">
                  <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 bg-green-50 rounded p-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <div className="text-sm font-semibold text-blue-900">Contact Details</div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {row.contact}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            emptyMessage="No additional details available."
          />
        );
      },
      render: (item: Guardian) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
                className={`h-8 w-8 p-0 rounded-full transition-all duration-200 hover:bg-blue-50 hover:scale-110 ${
                  expandedRowIds.includes(item.guardianId.toString()) 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-blue-600'
                }`}
          onClick={() => handleToggleExpand(item.guardianId.toString())}
        >
          {expandedRowIds.includes(item.guardianId.toString()) ? (
                  <ChevronUp className="h-4 w-4" />
          ) : (
                  <ChevronDown className="h-4 w-4" />
          )}
        </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{expandedRowIds.includes(item.guardianId.toString()) ? 'Collapse details' : 'Expand details'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      header: (
        <SharedCheckbox 
          checked={isAllSelected} 
          indeterminate={isIndeterminate} 
          onCheckedChange={handleSelectAll}
          aria-label="Select all guardians"
        />
      ),
      accessor: 'select',
      className: 'w-10 text-center',
    },
    ...guardianColumns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => {
        if (col.key === 'firstName') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: Guardian) => {
              const fuseResult = fuzzyResults.find(r => r.item.guardianId === item.guardianId) as FuseResult<Guardian> | undefined;
              const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "firstName")?.indices;
              const highlightedText = nameMatches 
                ? highlightMatch(item.firstName, nameMatches)
                : highlightSearchTerm(item.firstName, debouncedSearchInput);
              return (
                <div 
                  className="text-sm font-medium text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              );
            }
          };
        }
        if (col.key === 'lastName') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: Guardian) => {
              const fuseResult = fuzzyResults.find(r => r.item.guardianId === item.guardianId) as FuseResult<Guardian> | undefined;
              const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "lastName")?.indices;
              const highlightedText = nameMatches 
                ? highlightMatch(item.lastName, nameMatches)
                : highlightSearchTerm(item.lastName, debouncedSearchInput);
              return (
                <div 
                  className="text-sm font-medium text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              );
            }
          };
        }
        if (col.key === 'email') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: Guardian) => {
              const fuseResult = fuzzyResults.find(r => r.item.guardianId === item.guardianId) as FuseResult<Guardian> | undefined;
              const emailMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "email")?.indices;
              const highlightedText = emailMatches 
                ? highlightMatch(item.email, emailMatches)
                : highlightSearchTerm(item.email, debouncedSearchInput);
              return (
                <div 
                  className="text-sm text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              );
            }
          };
        }
        if (col.key === 'guardianType') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: Guardian) => (
              <Badge 
                variant={item.guardianType === 'PARENT' ? 'default' : 'secondary'} 
                className="text-xs"
              >
                {item.guardianType}
              </Badge>
            )
          };
        }
        if (col.key === 'status') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: Guardian) => (
              <Badge variant={item.status === "ACTIVE" ? "success" : "destructive"} className="text-center">
                {item.status}
              </Badge>
            )
          };
        }
        if (col.key === 'totalStudents') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: Guardian) => (
              <span className="text-sm text-blue-900 text-center font-medium">
                {item.totalStudents}
              </span>
            )
          };
        }
        if (col.key === 'createdAt') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: Guardian) => (
              <span className="text-sm text-blue-900 text-center">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            )
          };
        }
        return {
          header: col.label,
          accessor: col.accessor,
          className: 'text-center',
          sortable: col.sortable
        };
      }),
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      render: (item: Guardian) => (
        <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Guardian"
                  className="hover:bg-blue-50"
                  onClick={() => {
                    setSelectedGuardian(item);
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
                  aria-label="Edit Guardian"
                  className="hover:bg-green-50"
                  onClick={() => {
                    setSelectedGuardian(item);
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
            {item.status === "INACTIVE" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Restore Guardian"
                    className="hover:bg-green-50"
                    onClick={() => handleRestore(item)}
                    disabled={restoringId === item.guardianId.toString()}
                  >
                    {restoringId === item.guardianId.toString() ? (
                      <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                    ) : (
                    <RotateCcw className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                  Restore guardian
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Deactivate Guardian"
                      className="hover:bg-red-50"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                  Deactivate guardian
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )
    }
  ];

  // Handler for sorting columns
  const handleSort = (field: string) => {
    setSortField((prevField) => {
      const isSameField = prevField === field;
      const newOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      setSortFields([{ field: field, order: newOrder }]);
      return field;
    });
  };

  // Fetch guardians
  const fetchGuardians = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch('/api/guardians');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setGuardians(data.data);
        setError(null);
        if (refresh) toast.success('Guardians refreshed successfully');
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching guardians:', err);
      setError('Failed to load guardians. Please try again later.');
      if (refresh) toast.error('Failed to refresh guardians. Please try again later.');
      else toast.error('Failed to load guardians. Please try again later.');
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchGuardians();
  }, []);

  // Handle search state
  useEffect(() => {
    if (searchInput !== debouncedSearchInput) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchInput, debouncedSearchInput]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search guardians"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchInput) {
        setSearchInput('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchInput]);

  const handleView = (guardian: Guardian) => {
    setViewGuardian(guardian);
    setViewDialogOpen(true);
  };

  const handleEdit = (guardian: Guardian) => {
    setModalGuardian(guardian);
    setModalOpen(true);
  };

  const handleDelete = (guardian: Guardian) => {
    setGuardianToDelete({ id: guardian.guardianId.toString(), name: `${guardian.firstName} ${guardian.lastName}` });
    setDeleteDialogOpen(true);
  };

  // Handler to restore (reactivate) an inactive guardian
  const handleRestore = async (guardian: Guardian) => {
    setRestoringId(guardian.guardianId.toString());
    try {
      const res = await fetch(`/api/guardians/${guardian.guardianId}`, {
        method: 'PUT',
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
        toast.error(data?.error || 'Failed to restore guardian.');
        setRestoringId(null);
        return;
      }
      toast.success('Guardian restored successfully!');
      fetchGuardians();
    } catch (err) {
      toast.error('Failed to restore guardian.');
    } finally {
      setRestoringId(null);
    }
  };

  const confirmDelete = async () => {
    if (!guardianToDelete) return;

    try {
      const response = await fetch(`/api/guardians/${guardianToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to deactivate guardian');

      setGuardians(prev => prev.map(g => 
        g.guardianId.toString() === guardianToDelete.id ? { ...g, status: 'INACTIVE' } : g
      ));
      toast.success('Guardian deactivated successfully');
      setDeleteDialogOpen(false);
      setGuardianToDelete(null);
    } catch (error) {
      toast.error('Failed to deactivate guardian');
    }
  };

  const refreshGuardians = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/guardians');
      if (!response.ok) throw new Error('Failed to fetch guardians');
      const data = await response.json();
      setGuardians(data.data || []);
      toast.success('Guardians refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh guardians');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Guardians"
          subtitle="Manage student guardians and their information"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "User Management", href: "/user-management" },
            { label: "Guardians" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Users className="text-blue-700 w-5 h-5" />}
            label="Total Guardians"
            value={guardians.length}
            valueClassName="text-blue-900"
            sublabel="Total number of guardians"
            loading={loading}
          />
          <SummaryCard
            icon={<UserCheck className="text-blue-700 w-5 h-5" />}
            label="Active Guardians"
            value={guardians.filter(g => g.status === 'ACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Currently active"
            loading={loading}
          />
          <SummaryCard
            icon={<UserX className="text-blue-700 w-5 h-5" />}
            label="Inactive Guardians"
            value={guardians.filter(g => g.status === 'INACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Inactive guardians"
            loading={loading}
          />
          <SummaryCard
            icon={<GraduationCap className="text-blue-700 w-5 h-5" />}
            label="Total Students"
            value={guardians.reduce((sum, g) => sum + g.totalStudents, 0)}
            valueClassName="text-blue-900"
            sublabel="Students under guardianship"
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
                id: 'add-guardian',
                label: 'Add Guardian',
                description: 'Create new guardian',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => setAddModalOpen(true)
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload guardian data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: () => fetchGuardians(true),
                disabled: isRefreshing,
                loading: isRefreshing
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
              {/* Blue Gradient Header */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Guardian List</h3>
                      <p className="text-blue-100 text-sm">Search and filter guardian information</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Error State */}
            {error && (
              <div className="p-3 sm:p-4 lg:p-6 bg-red-50 border-b border-red-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-red-800 text-sm sm:text-base">Error Loading Data</h4>
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              {/* Search Results Summary */}
              {searchInput && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Search results for "{searchInput}"
                      </span>
                      <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                        {filteredGuardians.length} {filteredGuardians.length === 1 ? 'guardian' : 'guardians'} found
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchInput('')}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* Search Bar - Takes up space on larger screens */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                  )}
                  <input
                    type="text"
                    placeholder="Search guardians by name, email, phone... (Ctrl+K to focus)"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className={`w-full pl-10 pr-10 h-9 sm:h-10 border border-gray-300 rounded text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-all duration-200 ${
                      searchInput ? 'border-blue-300 bg-blue-50/30' : ''
                    }`}
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Quick Filter Dropdowns - In one row on larger screens */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 sm:w-36 text-xs sm:text-sm text-gray-500 h-9 sm:h-10 rounded">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" /></span> Active
                        </span>
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><X className="w-3 h-3 sm:w-4 sm:h-4" /></span> Inactive
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm text-gray-500 h-9 sm:h-10 rounded">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PARENT">Parent</SelectItem>
                      <SelectItem value="GUARDIAN">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Table layout for xl+ only */}
            <div className="hidden xl:block">
              <div className="px-4 sm:px-6 pt-6 pb-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                      <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {loading ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
                          <span className="text-base sm:text-lg font-semibold text-blue-900">Loading guardians...</span>
                      </div>
                        <p className="text-xs sm:text-sm text-blue-700 text-center">Please wait while we fetch the latest data</p>
                    </div>
                  ) : !loading && filteredGuardians.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4">
                      <EmptyState
                          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />}
                        title={searchInput ? "No guardians found matching your search" : "No guardians found"}
                        description={searchInput ? 
                          `No guardians match "${searchInput}". Try different keywords or clear the search.` : 
                          "Try adjusting your search criteria or filters to find the guardians you're looking for."
                        }
                        action={
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                            {searchInput && (
                              <Button
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-sm sm:text-base"
                                onClick={() => setSearchInput('')}
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                Clear Search
                              </Button>
                            )}
                            <Button
                              variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-sm sm:text-base"
                              onClick={() => fetchGuardians(true)}
                            >
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              Refresh Data
                            </Button>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <TableList
                      columns={columns}
                      data={paginatedGuardians}
                      loading={loading}
                      selectedIds={selectedIds}
                      emptyMessage={null}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                      isAllSelected={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      getItemId={(item) => item.guardianId.toString()}
                      className="border-0 shadow-none max-w-full"
                      sortState={{ field: sortField, order: sortOrder }}
                      onSort={handleSort}
                      expandedRowIds={expandedRowIds}
                      onToggleExpand={handleToggleExpand}
                    />
                  )}
                  </div>
                </div>
                </div>
              </div>
              
            {/* Card layout for small screens */}
            <div className="block xl:hidden p-2 sm:p-3 lg:p-4 max-w-full">
              <div className="px-2 sm:px-4 pt-6 pb-6">
                {!loading && filteredGuardians.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <EmptyState
                      icon={<Users className="w-6 h-6 text-blue-400" />}
                      title={searchInput ? "No guardians found matching your search" : "No guardians found"}
                      description={searchInput ? 
                        `No guardians match "${searchInput}". Try different keywords or clear the search.` : 
                        "Try adjusting your search criteria or filters to find the guardians you're looking for."
                      }
                      action={
                        <div className="flex flex-col gap-2 w-full">
                          {searchInput && (
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={() => setSearchInput('')}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Search
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                            onClick={() => fetchGuardians(true)}
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
                  items={paginatedGuardians}
                  selectedIds={selectedIds}
                  onSelect={handleSelectRow}
                  onView={(item) => {
                    setSelectedGuardian(item);
                    setViewModalOpen(true);
                  }}
                  onEdit={(item) => {
                    setSelectedGuardian(item);
                    setEditModalOpen(true);
                  }}
                    onDelete={(item) => handleDelete(item)}
                  getItemId={(item) => item.guardianId.toString()}
                  getItemName={(item) => `${item.firstName} ${item.lastName}`}
                  getItemCode={(item) => item.guardianId.toString()}
                  getItemStatus={(item) => item.status.toLowerCase() as 'active' | 'inactive'}
                  getItemDescription={(item) => item.email}
                  getItemDetails={(item) => [
                    { label: 'Phone', value: item.phoneNumber },
                    { label: 'Type', value: item.guardianType },
                    { label: 'Students', value: item.totalStudents.toString() },
                    { label: 'Created', value: new Date(item.createdAt).toLocaleDateString() },
                  ]}
                  isLoading={loading}
                />
                )}
              </div>
              </div>
              
              {/* Pagination */}
              <TablePagination
                page={currentPage}
                pageSize={itemsPerPage}
                totalItems={filteredGuardians.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
              pageSizeOptions={[10, 25, 50, 100]}
              loading={loading}
              />
          </Card>
        </div>

        {/* Add Guardian Dialog */}
        <GuardianForm
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          type="create"
          onSuccess={() => {
            setAddModalOpen(false);
            fetchGuardians();
          }}
        />

        {/* Edit Guardian Dialog */}
        {editModalOpen && selectedGuardian && (
          <GuardianForm
            key={selectedGuardian.guardianId}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            type="update"
            data={selectedGuardian}
            id={selectedGuardian.guardianId.toString()}
            onSuccess={() => {
              setEditModalOpen(false);
              fetchGuardians();
            }}
          />
        )}

        {/* View Guardian Dialog */}
        <ViewDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedGuardian ? `${selectedGuardian.firstName} ${selectedGuardian.lastName}` : "Guardian Details"}
          subtitle={selectedGuardian?.email}
          status={selectedGuardian ? {
            value: selectedGuardian.status,
            variant: selectedGuardian.status === "ACTIVE" ? "success" : "destructive"
          } : undefined}
          headerVariant="default"
          sections={selectedGuardian ? ([
            {
              title: "Personal Information",
              fields: [
                { label: 'Guardian ID', value: String(selectedGuardian.guardianId), icon: <Hash className="w-4 h-4 text-blue-600" /> },
                { label: 'Full Name', value: `${selectedGuardian.firstName} ${selectedGuardian.middleName || ''} ${selectedGuardian.lastName} ${selectedGuardian.suffix || ''}`.trim(), icon: <UserCheckIcon className="w-4 h-4 text-blue-600" /> },
                { label: 'Email', value: selectedGuardian.email, icon: <Mail className="w-4 h-4 text-blue-600" /> },
                { label: 'Phone', value: selectedGuardian.phoneNumber, icon: <Phone className="w-4 h-4 text-blue-600" /> },
                { label: 'Gender', value: selectedGuardian.gender, icon: <UserCheckIcon className="w-4 h-4 text-blue-600" /> },
                { label: 'Guardian Type', value: selectedGuardian.guardianType, icon: <Users className="w-4 h-4 text-blue-600" /> },
                { label: 'Status', value: selectedGuardian.status, icon: <Info className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Contact & Professional Information",
              fields: [
                { label: 'Address', value: selectedGuardian.address, icon: <MapPin className="w-4 h-4 text-blue-600" /> },
                { label: 'Occupation', value: selectedGuardian.occupation || 'Not specified', icon: <Briefcase className="w-4 h-4 text-blue-600" /> },
                { label: 'Workplace', value: selectedGuardian.workplace || 'Not specified', icon: <Building2 className="w-4 h-4 text-blue-600" /> },
                { label: 'Emergency Contact', value: selectedGuardian.emergencyContact || 'Not specified', icon: <Phone className="w-4 h-4 text-blue-600" /> },
                { label: 'Relationship to Student', value: selectedGuardian.relationshipToStudent, icon: <Users className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Student Information",
              fields: [
                { label: 'Total Students', value: String(selectedGuardian.totalStudents), icon: <GraduationCap className="w-4 h-4 text-blue-600" /> },
                ...(selectedGuardian.Student && selectedGuardian.Student.length > 0 
                  ? selectedGuardian.Student.map((student, index) => ({
                      label: `Student ${index + 1}`,
                      value: `${student.firstName} ${student.lastName} (${student.studentIdNum})`,
                      icon: <GraduationCap className="w-4 h-4 text-blue-600" />
                    }))
                  : [{ label: 'Assigned Students', value: 'No students assigned', icon: <GraduationCap className="w-4 h-4 text-blue-600" /> }]
                )
              ]
            },
            {
              title: "Timestamps",
              fields: [
                { label: 'Created At', value: selectedGuardian.createdAt, type: 'date', icon: <Calendar className="w-4 h-4 text-blue-600" /> },
                { label: 'Last Updated', value: selectedGuardian.updatedAt, type: 'date', icon: <RefreshCw className="w-4 h-4 text-blue-600" /> },
                { label: 'Last Login', value: selectedGuardian.lastLogin || 'Never', type: 'date', icon: <Activity className="w-4 h-4 text-blue-600" /> },
              ]
            }
          ].filter(Boolean) as import('@/components/reusable/Dialogs/ViewDialog').ViewDialogSection[]) : []}
          description={selectedGuardian?.guardianType ? `Type: ${selectedGuardian.guardianType}` : undefined}
          tooltipText="View detailed guardian information"
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setGuardianToDelete(null);
          }}
          itemName={guardianToDelete?.name}
          onDelete={confirmDelete}
          onCancel={() => { setDeleteDialogOpen(false); setGuardianToDelete(null); }}
          canDelete={true}
          description={guardianToDelete ? 
            `Are you sure you want to deactivate the guardian "${guardianToDelete.name}"? This action can be reversed by reactivating the guardian.` :
            'Are you sure you want to deactivate this guardian? This action can be reversed by reactivating the guardian.'}
        />
      </div>
    </div>
  );
}
