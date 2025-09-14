"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import Fuse from "fuse.js";
import React from "react";
import { Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, UserCheck, UserX, Users, UserPlus, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, Hash, Tag, Layers, FileText, Clock, Info, UserCheck as UserCheckIcon, Archive, CreditCard, Filter, Edit, User, MapPin, AlertTriangle, Wifi, Signal, Battery, Zap } from "lucide-react";
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
import { Pagination, CompactPagination } from "@/components/Pagination";
import { useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { safeHighlight } from "@/lib/sanitizer";

type TagStatus = "active" | "inactive" | "lost" | "damaged";
type SortField = 'tagId' | 'studentName' | 'status' | 'lastSeen' | 'location' | 'scanCount' | 'assignedAt';
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

const tagSortFieldOptions: SortFieldOption<string>[] = [
  { value: 'tagId', label: 'Tag ID' },
  { value: 'studentName', label: 'Student Name' },
  { value: 'status', label: 'Status' },
  { value: 'lastSeen', label: 'Last Seen' },
  { value: 'location', label: 'Location' },
  { value: 'scanCount', label: 'Scan Count' },
  { value: 'assignedAt', label: 'Assigned Date' },
];

type TagSortField = 'tagId' | 'studentName' | 'status' | 'lastSeen' | 'location' | 'scanCount' | 'assignedAt';
type TagSortOrder = 'asc' | 'desc';

// Centralized tag columns definition
const tagColumns = [
  { key: 'tagId', label: 'Tag ID', accessor: 'tagNumber', className: 'text-blue-900', sortable: true },
  { key: 'studentName', label: 'Assigned To', accessor: 'studentName', className: 'text-blue-900', sortable: true },
  { key: 'status', label: 'Status', accessor: 'status', className: 'text-center', sortable: true },
  { key: 'lastSeen', label: 'Last Used', accessor: 'lastUsed', className: 'text-center text-blue-900', sortable: true },
  { key: 'location', label: 'Notes', accessor: 'notes', className: 'text-center text-blue-900', sortable: true },
  { key: 'scanCount', label: 'Type', accessor: 'tagType', className: 'text-center text-blue-900', sortable: true },
  { key: 'assignedAt', label: 'Assigned Date', accessor: 'assignedAt', className: 'text-center text-blue-900', sortable: true },
];

// Use accessor/label for TableHeaderSection compatibility
const exportableColumns: { accessor: string; label: string }[] = tagColumns.map((col) => ({ accessor: col.key, label: col.label }));
// For export dialogs, use the old { key, label } version
const exportableColumnsForExport: { key: string; label: string }[] = tagColumns.map((col) => ({ key: col.key, label: col.label }));

// Define column options for visible columns dialog
const COLUMN_OPTIONS: ColumnOption[] = tagColumns.map(col => ({
  accessor: typeof col.accessor === 'string' ? col.accessor : col.key,
  header: col.label,
  description: undefined,
  category: 'Tag Info',
  required: col.key === 'tagId' || col.key === 'status', // Always show tag ID and status
}));

interface RFIDTag {
  tagId: number;
  tagNumber: string;
  tagType: 'STUDENT_CARD' | 'INSTRUCTOR_CARD' | 'TEMPORARY_PASS' | 'VISITOR_PASS' | 'MAINTENANCE' | 'TEST';
  assignedAt: string;
  lastUsed?: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOST' | 'DAMAGED' | 'EXPIRED' | 'REPLACED' | 'RESERVED';
  notes?: string;
  studentId?: number;
  instructorId?: number;
  assignedBy?: number;
  assignmentReason?: string;
  student?: {
    studentId: number;
    firstName: string;
    lastName: string;
    studentIdNum: string;
  };
  instructor?: {
    instructorId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function RFIDTagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<RFIDTag | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<TagSortField>('tagId');
  const [sortOrder, setSortOrder] = useState<TagSortOrder>('asc');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [sortFields, setSortFields] = useState<MultiSortField[]>([
    { field: 'tagId', order: 'asc' }
  ]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(tagColumns.map(col => col.key));
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [selectedTagsForBulkAction, setSelectedTagsForBulkAction] = useState<RFIDTag[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/rfid/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch RFID tags');
      }
      const data = await response.json();
      setTags(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching RFID tags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch RFID tags');
      toast.error('Failed to fetch RFID tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Add Fuse.js setup with proper types
  const fuse = useMemo(() => new Fuse<RFIDTag>(tags, {
    keys: ["tagNumber", "student.firstName", "student.lastName", "instructor.firstName", "instructor.lastName"],
    threshold: 0.4,
    includeMatches: true,
  }), [tags]);

  const fuzzyResults = useMemo(() => {
    if (!searchInput) return tags.map((t: RFIDTag, i: number) => ({ item: t, refIndex: i }));
    return fuse.search(searchInput) as FuseResult<RFIDTag>[];
  }, [searchInput, fuse, tags]);

  const filteredTags = useMemo(() => {
    let filtered = fuzzyResults.map((r: FuseResult<RFIDTag>) => r.item);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(tag => tag.status === statusFilter.toUpperCase());
    }

    // Apply multi-sort
    if (sortFields.length > 0) {
      filtered.sort((a, b) => {
        for (const { field, order } of sortFields) {
          const aValue = a[field as keyof RFIDTag];
          const bValue = b[field as keyof RFIDTag];
          
          if (aValue === bValue) continue;
          
          const comparison = (aValue ?? '') < (bValue ?? '') ? -1 : 1;
          return order === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [fuzzyResults, statusFilter, sortFields]);

  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTags.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTags, currentPage, itemsPerPage]);

  const isAllSelected = paginatedTags.length > 0 && paginatedTags.every(t => selectedIds.includes(t.tagId.toString()));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTags.map(t => t.tagId.toString()));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);

  const stats = useMemo(() => ({
    total: tags.length,
    active: tags.filter(t => t.status === 'ACTIVE').length,
    inactive: tags.filter(t => t.status === 'INACTIVE').length,
    lost: tags.filter(t => t.status === 'LOST').length,
    damaged: tags.filter(t => t.status === 'DAMAGED').length,
  }), [tags]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'lost': return <Badge variant="destructive">Lost</Badge>;
      case 'damaged': return <Badge variant="destructive">Damaged</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 80) return 'text-green-500';
    if (level > 50) return 'text-yellow-500';
    return 'text-red-500';
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
    setVisibleColumns(tagColumns.map(col => col.key));
    toast.success('Column visibility reset to default');
  };

  // Handler for sorting columns
  const handleSort = (field: string) => {
    setSortField((prevField) => {
      const isSameField = prevField === field;
      const newOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder as TagSortOrder);
      setSortFields([{ field: field as TagSortField, order: newOrder as TagSortOrder }]);
      return field as TagSortField;
    });
  };

  // Top bar actions
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTags().finally(() => {
      setIsRefreshing(false);
    });
  };

  // Table columns (filtered by visibleColumns)
  const columns: TableListColumn<RFIDTag>[] = [
    {
      header: (
        <SharedCheckbox 
          checked={isAllSelected} 
          indeterminate={isIndeterminate} 
          onCheckedChange={handleSelectAll}
          aria-label="Select all tags"
        />
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    ...tagColumns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => {
        if (col.key === 'tagId') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDTag) => {
              const fuseResult = fuzzyResults.find(r => r.item.tagId === item.tagId) as FuseResult<RFIDTag> | undefined;
              const tagIdMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "tagNumber")?.indices;
              return (
                <div 
                  className="text-sm font-medium text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: safeHighlight(item.tagNumber, tagIdMatches) }}
                />
              );
            }
          };
        }
        if (col.key === 'studentName') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDTag) => {
              const fuseResult = fuzzyResults.find(r => r.item.tagId === item.tagId) as FuseResult<RFIDTag> | undefined;
              const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "student.firstName")?.indices;
              return (
                <div className="text-center">
                  {item.student ? (
                    <div>
                      <div 
                        className="font-medium text-blue-900"
                        dangerouslySetInnerHTML={{ __html: safeHighlight(`${item.student.firstName} ${item.student.lastName}`, nameMatches) }}
                      />
                      <div className="text-sm text-muted-foreground">{item.student.studentIdNum}</div>
                    </div>
                  ) : item.instructor ? (
                    <div>
                      <div className="font-medium text-blue-900">
                        {item.instructor.firstName} {item.instructor.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">Instructor</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </div>
              );
            }
          };
        }
        if (col.key === 'status') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDTag) => getStatusBadge(item.status)
          };
        }
        if (col.key === 'lastSeen') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDTag) => (
              <div className="flex items-center gap-1 justify-center">
                <Clock className="w-3 h-3" />
                <span className="text-sm">{item.lastUsed ? new Date(item.lastUsed).toLocaleString() : 'Never'}</span>
              </div>
            )
          };
        }
        if (col.key === 'location') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDTag) => (
              <div className="flex items-center gap-1 justify-center">
                <MapPin className="w-3 h-3" />
                <span className="text-sm">{item.notes || 'N/A'}</span>
              </div>
            )
          };
        }
        if (col.key === 'scanCount') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDTag) => (
              <span className="text-sm text-blue-900">{item.tagType}</span>
            )
          };
        }
        if (col.key === 'assignedAt') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDTag) => (
              <div className="flex items-center gap-1 justify-center">
                <span className="text-sm text-blue-900">{item.assignedAt ? new Date(item.assignedAt).toLocaleDateString() : 'N/A'}</span>
              </div>
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
      render: (item: RFIDTag) => (
        <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Tag"
                  className="hover:bg-blue-50"
                  onClick={() => {
                    setSelectedTag(item);
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
                  aria-label="Edit Tag"
                  className="hover:bg-green-50"
                  onClick={() => {
                    setSelectedTag(item);
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete Tag"
                  className="hover:bg-red-50"
                  onClick={() => {
                    setSelectedTag(item);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                Delete
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];

  const selectedTags = tags.filter(tag => selectedIds.includes(tag.tagId.toString()));
  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map(col => col.accessor));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="RFID Tags"
          subtitle="Manage and monitor RFID tags assigned to students"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'RFID Management', href: '/rfid' },
            { label: 'Tags' }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<CreditCard className="text-blue-500 w-5 h-5" />}
            label="Total Tags"
            value={tags.length}
            valueClassName="text-blue-900"
            sublabel="Total number of tags"
          />
          <SummaryCard
            icon={<UserCheck className="text-blue-500 w-5 h-5" />}
            label="Active Tags"
            value={tags.filter(t => t.status === 'ACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Currently active"
          />
          <SummaryCard
            icon={<UserX className="text-blue-500 w-5 h-5" />}
            label="Inactive Tags"
            value={tags.filter(t => t.status === 'INACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Inactive or damaged"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-blue-500 w-5 h-5" />}
            label="Lost Tags"
            value={tags.filter(t => t.status === 'LOST').length}
            valueClassName="text-blue-900"
            sublabel="Lost or missing"
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
                id: 'add-tag',
                label: 'Add Tag',
                description: 'Create new RFID tag',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => { 
                  setSelectedTag(null); 
                  setAddModalOpen(true); 
                }
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import tags from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print tag list',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => {/* handlePrint */}
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
                description: 'Reload tag data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: () => handleRefresh(),
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
                      <h3 className="text-lg font-bold text-white">RFID Tags List</h3>
                      <p className="text-blue-100 text-sm">Search and filter RFID tag information</p>
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
                    placeholder="Search tags..."
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
                      <SelectItem value="ACTIVE">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><UserCheck className="w-4 h-4" /></span> Active
                        </span>
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><UserX className="w-4 h-4" /></span> Inactive
                        </span>
                      </SelectItem>
                      <SelectItem value="LOST">
                        <span className="flex items-center gap-2">
                          <span className="text-orange-500"><AlertTriangle className="w-4 h-4" /></span> Lost
                        </span>
                      </SelectItem>
                      <SelectItem value="DAMAGED">
                        <span className="flex items-center gap-2">
                          <span className="text-red-600"><AlertTriangle className="w-4 h-4" /></span> Damaged
                        </span>
                      </SelectItem>
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
                  entityLabel="tag"
                  actions={[
                    {
                      key: "bulk-actions",
                      label: "Bulk Actions",
                      icon: <Settings className="w-4 h-4 mr-2" />,
                      onClick: () => setBulkActionsDialogOpen(true),
                      tooltip: "Open enhanced bulk actions dialog",
                      variant: "default"
                    },
                    {
                      key: "export",
                      label: "Quick Export",
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: () => {/* handleExportSelectedTags */},
                      tooltip: "Quick export selected tags to CSV"
                    },
                    {
                      key: "delete",
                      label: "Delete Selected",
                      icon: loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: () => setBulkActionsDialogOpen(true),
                      loading: loading,
                      disabled: loading,
                      tooltip: "Delete selected tags",
                      variant: "destructive"
                    }
                  ]}
                  onClear={() => setSelectedIds([])}
                />
              </div>
            )}
            {/* Table Content */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {/* Loader overlay when refreshing */}
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {!loading && filteredTags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<CreditCard className="w-6 h-6 text-blue-400" />}
                        title="No RFID tags found"
                        description="Try adjusting your search criteria or filters to find the tags you're looking for."
                        action={
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={() => handleRefresh()}
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
                      data={paginatedTags}
                      loading={loading}
                      selectedIds={selectedIds}
                      emptyMessage={null}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                      isAllSelected={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      getItemId={(item) => item.tagId.toString()}
                      className="border-0 shadow-none max-w-full"
                      sortState={{ field: sortField, order: sortOrder }}
                      onSort={handleSort}
                    />
                  )}
                </div>
              </div>
              {/* Pagination */}
              <TablePagination
                page={currentPage}
                pageSize={itemsPerPage}
                totalItems={filteredTags.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="tag"
              />
            </div>
          </Card>
        </div>

        {/* Dialogs */}
        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={COLUMN_OPTIONS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onReset={handleResetColumns}
          title="Manage Tag Columns"
          description="Choose which columns to display in the tag table"
          searchPlaceholder="Search tag columns..."
          enableManualSelection={true}
        />

        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortField={sortField}
          setSortField={field => setSortField(field as TagSortField)}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortFieldOptions={tagSortFieldOptions}
          onApply={() => {
            setSortFields([{ field: sortField as SortField, order: sortOrder }]);
            setSortDialogOpen(false);
          }}
          onReset={() => {
            setSortField('tagId');
            setSortOrder('asc');
            setSortFields([{ field: 'tagId' as SortField, order: 'asc' }]);
            setSortDialogOpen(false);
          }}
          title="Sort Tags"
          tooltip="Sort tags by different fields. Choose the field and order to organize your list."
        />

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          exportableColumns={exportableColumnsForExport}
          exportColumns={exportColumns}
          setExportColumns={setExportColumns}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          onExport={() => {/* handleExport */}}
          title="Export Tags"
          tooltip="Export tag data in various formats. Choose your preferred export options."
        />

        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={async (data) => {
            // Placeholder implementation
            return { success: data.length, failed: 0, errors: [] };
          }}
          entityName="RFIDTag"
          templateUrl={undefined}
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={5}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={selectedTagsForBulkAction}
          entityType="tag"
          entityLabel="tag"
          availableActions={[
            { id: 'status-update', label: 'Update Status', description: 'Update status of selected tags', icon: <Settings className="w-4 h-4" />, tabId: 'actions' },
            { id: 'notification', label: 'Send Notification', description: 'Send notification to administrators', icon: <Bell className="w-4 h-4" />, tabId: 'actions' },
            { id: 'export', label: 'Export Data', description: 'Export selected tags data', icon: <Download className="w-4 h-4" />, tabId: 'actions' },
          ]}
          onActionComplete={() => {/* handleBulkActionComplete */}}
          onCancel={() => setBulkActionsDialogOpen(false)}
          onProcessAction={async (actionType: string, config: any) => {
            // Placeholder implementation
            return { success: true };
          }}
          getItemId={(item: RFIDTag) => item.tagId.toString()}
          getItemDisplayName={(item: RFIDTag) => item.tagNumber}
          getItemStatus={(item: RFIDTag) => item.status}
        />
      </div>
    </div>
  );
} 