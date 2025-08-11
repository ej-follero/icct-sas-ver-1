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
import { Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, UserCheck, UserX, Users, UserPlus, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, Hash, Tag, Layers, FileText, Clock, Info, UserCheck as UserCheckIcon, Archive, MapPin, CreditCard, ScanLine, CheckCircle, XCircle, AlertTriangle, Filter, Calendar } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TableHeaderSection } from '@/components/reusable/Table/TableHeaderSection';
import { useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeHighlight } from "@/lib/sanitizer";

type RFIDLogStatus = "success" | "error" | "unauthorized" | "timeout";
type RFIDScanType = "entry" | "exit" | "attendance" | "access";

interface RFIDLog {
  id: string;
  tagId: string;
  readerId: string;
  studentId?: string;
  studentName?: string;
  location: string;
  timestamp: string;
  status: RFIDLogStatus;
  scanType: RFIDScanType;
  duration?: number; // in minutes
  notes?: string;
}

type SortField = 'tagId' | 'studentName' | 'readerId' | 'location' | 'timestamp' | 'status' | 'scanType';
type SortOrder = 'asc' | 'desc';

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

const rfidLogSortFieldOptions: SortFieldOption<string>[] = [
  { value: 'tagId', label: 'Tag ID' },
  { value: 'studentName', label: 'Student Name' },
  { value: 'readerId', label: 'Reader ID' },
  { value: 'location', label: 'Location' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'status', label: 'Status' },
  { value: 'scanType', label: 'Scan Type' },
];

type RFIDLogSortField = 'tagId' | 'studentName' | 'readerId' | 'location' | 'timestamp' | 'status' | 'scanType';
type RFIDLogSortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

// Centralized RFID log columns definition
const rfidLogColumns = [
  { key: 'tagId', label: 'Tag ID', accessor: 'tagId', className: 'text-blue-900', sortable: true },
  { key: 'studentName', label: 'Student', accessor: 'studentName', className: 'text-blue-900', sortable: true },
  { key: 'readerId', label: 'Reader ID', accessor: 'readerId', className: 'text-blue-900', sortable: true },
  { key: 'location', label: 'Location', accessor: 'location', className: 'text-blue-900', sortable: true },
  { key: 'scanType', label: 'Scan Type', accessor: 'scanType', className: 'text-center text-blue-900', sortable: true },
  { key: 'status', label: 'Status', accessor: 'status', className: 'text-center', sortable: true },
  { key: 'timestamp', label: 'Timestamp', accessor: 'timestamp', className: 'text-blue-900', sortable: true },
];

// Use accessor/label for TableHeaderSection compatibility
const exportableColumns: { accessor: string; label: string }[] = rfidLogColumns.map((col) => ({ accessor: col.key, label: col.label }));
// For export dialogs, use the old { key, label } version
const exportableColumnsForExport: { key: string; label: string }[] = rfidLogColumns.map((col) => ({ key: col.key, label: col.label }));

// Define column options for visible columns dialog
const COLUMN_OPTIONS: ColumnOption[] = rfidLogColumns.map(col => ({
  accessor: typeof col.accessor === 'string' ? col.accessor : col.key,
  header: col.label,
  description: undefined,
  category: 'RFID Log Info',
  required: col.key === 'tagId' || col.key === 'timestamp', // Always show tag ID and timestamp
}));

export default function RFIDLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<RFIDLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<RFIDLog | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scanTypeFilter, setScanTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState<RFIDLogSortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<RFIDLogSortOrder>('desc');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [sortFields, setSortFields] = useState<MultiSortField[]>([
    { field: 'timestamp', order: 'desc' }
  ]);
  const [advancedFilters, setAdvancedFilters] = useState({
    location: '',
    minDuration: '',
    maxDuration: '',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  // Move visibleColumns state here, before any usage
  const [visibleColumns, setVisibleColumns] = useState<string[]>(rfidLogColumns.map(col => col.key));
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [selectedLogsForBulkAction, setSelectedLogsForBulkAction] = useState<RFIDLog[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  // Add import dialog state if not present
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    // Mock data - replace with actual API calls
    setLogs([
      {
        id: '1',
        tagId: 'RFID-001',
        readerId: 'Reader-101',
        studentId: 'STU001',
        studentName: 'John Doe',
        location: 'Room 101',
        timestamp: '2024-01-15 14:30:25',
        status: 'success',
        scanType: 'attendance',
        duration: 90,
      },
      {
        id: '2',
        tagId: 'RFID-002',
        readerId: 'Reader-102',
        studentId: 'STU002',
        studentName: 'Jane Smith',
        location: 'Room 102',
        timestamp: '2024-01-15 14:29:18',
        status: 'success',
        scanType: 'attendance',
        duration: 90,
      },
      {
        id: '3',
        tagId: 'RFID-003',
        readerId: 'Reader-103',
        studentId: 'STU003',
        studentName: 'Mike Johnson',
        location: 'Room 103',
        timestamp: '2024-01-15 14:28:45',
        status: 'error',
        scanType: 'attendance',
        notes: 'Tag not recognized',
      },
      {
        id: '4',
        tagId: 'RFID-004',
        readerId: 'Reader-104',
        studentId: 'STU004',
        studentName: 'Sarah Wilson',
        location: 'Library',
        timestamp: '2024-01-15 14:25:30',
        status: 'success',
        scanType: 'entry',
      },
      {
        id: '5',
        tagId: 'RFID-005',
        readerId: 'Reader-105',
        location: 'Computer Lab',
        timestamp: '2024-01-15 14:20:15',
        status: 'unauthorized',
        scanType: 'access',
        notes: 'Access denied - restricted area',
      },
    ]);
  }, []);

  // Add Fuse.js setup with proper types
  const fuse = useMemo(() => new Fuse<RFIDLog>(logs, {
    keys: ["tagId", "studentName", "studentId", "readerId", "location"],
    threshold: 0.4,
    includeMatches: true,
  }), [logs]);

  const fuzzyResults = useMemo(() => {
    if (!searchInput) return logs.map((l: RFIDLog, i: number) => ({ item: l, refIndex: i }));
    return fuse.search(searchInput) as FuseResult<RFIDLog>[];
  }, [searchInput, fuse, logs]);

  // Update filtered logs to include column filters and status filter
  const filteredLogs = useMemo(() => {
    let filtered = fuzzyResults.map((r: FuseResult<RFIDLog>) => r.item);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // Apply scan type filter
    if (scanTypeFilter !== "all") {
      filtered = filtered.filter(log => log.scanType === scanTypeFilter);
    }

    // Apply location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(log => log.location === locationFilter);
    }

    // Apply column filters
    if (columnFilters.length > 0) {
      filtered = filtered.filter(log => {
        return columnFilters.every(filter => {
          const value = log[filter.field as keyof RFIDLog]?.toString().toLowerCase() || '';
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
          
          const comparison = (aValue || '') < (bValue || '') ? -1 : 1;
          return order === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [fuzzyResults, columnFilters, statusFilter, scanTypeFilter, locationFilter, sortFields]);

  // Add pagination
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const isAllSelected = paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.includes(l.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedLogs.map(l => l.id));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
    setVisibleColumns(rfidLogColumns.map(col => col.key));
    toast.success('Column visibility reset to default');
  };

  // Handler for sorting columns
  const handleSort = (field: string) => {
    setSortField((prevField) => {
      const isSameField = prevField === field;
      const newOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder as RFIDLogSortOrder);
      setSortFields([{ field: field as RFIDLogSortField, order: newOrder as RFIDLogSortOrder }]);
      return field as RFIDLogSortField;
    });
  };

  // Handler for toggling expanded rows
  const onToggleExpand = async (itemId: string) => {
    setExpandedRowIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'unauthorized': return <Badge variant="destructive">Unauthorized</Badge>;
      case 'timeout': return <Badge variant="secondary">Timeout</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScanTypeBadge = (type: string) => {
    switch (type) {
      case 'entry': return <Badge variant="outline">Entry</Badge>;
      case 'exit': return <Badge variant="outline">Exit</Badge>;
      case 'attendance': return <Badge variant="secondary">Attendance</Badge>;
      case 'access': return <Badge variant="outline">Access</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'unauthorized': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'timeout': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    errors: logs.filter(l => l.status === 'error').length,
    unauthorized: logs.filter(l => l.status === 'unauthorized').length,
    today: logs.filter(l => l.timestamp.startsWith('2024-01-15')).length,
  };

  // Table columns (filtered by visibleColumns)
  const columns: TableListColumn<RFIDLog>[] = [
    {
      header: '',
      accessor: 'expander',
      className: 'w-10 text-center px-1 py-1',
      render: (item: RFIDLog) => (
        <button
          onClick={() => onToggleExpand(item.id)}
          className="px-2 py-1 rounded-full hover:bg-gray-200 text-center"
          aria-label={expandedRowIds.includes(item.id) ? 'Collapse row' : 'Expand row'}
        >
          {expandedRowIds.includes(item.id) ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
        </button>
      ),
      expandedContent: (item: RFIDLog) => {
        return (
          <td colSpan={columns.length} className="p-0">
            <div className="bg-blue-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Log Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Tag ID:</span> {item.tagId}</div>
                    <div><span className="font-medium">Reader ID:</span> {item.readerId}</div>
                    <div><span className="font-medium">Student ID:</span> {item.studentId || 'N/A'}</div>
                    <div><span className="font-medium">Duration:</span> {item.duration ? `${item.duration} minutes` : 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Additional Info</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Notes:</span> {item.notes || 'No notes'}</div>
                    <div><span className="font-medium">Scan Type:</span> <Badge variant="outline">{item.scanType}</Badge></div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(item.status)}</div>
                  </div>
                </div>
              </div>
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
          aria-label="Select all logs"
        />
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    ...rfidLogColumns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => {
        if (col.key === 'tagId') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDLog) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<RFIDLog> | undefined;
              const tagIdMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "tagId")?.indices;
              return (
                <div 
                  className="text-sm font-medium text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: safeHighlight(item.tagId, tagIdMatches) }}
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
            render: (item: RFIDLog) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<RFIDLog> | undefined;
              const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "studentName")?.indices;
              return (
                <div className="text-center">
                  {item.studentName ? (
                    <div>
                      <div 
                        className="font-medium text-blue-900"
                        dangerouslySetInnerHTML={{ __html: safeHighlight(item.studentName, nameMatches) }}
                      />
                      <div className="text-sm text-muted-foreground">{item.studentId}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </div>
              );
            }
          };
        }
        if (col.key === 'readerId') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDLog) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<RFIDLog> | undefined;
              const readerMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "readerId")?.indices;
              return (
                <div className="flex items-center gap-1 justify-center">
                  <ScanLine className="w-3 h-3" />
                  <span 
                    className="text-sm text-blue-900"
                    dangerouslySetInnerHTML={{ __html: safeHighlight(item.readerId, readerMatches) }}
                  />
                </div>
              );
            }
          };
        }
        if (col.key === 'location') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDLog) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<RFIDLog> | undefined;
              const locationMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "location")?.indices;
              return (
                <div className="flex items-center gap-1 justify-center">
                  <MapPin className="w-3 h-3" />
                  <span 
                    className="text-sm text-blue-900"
                    dangerouslySetInnerHTML={{ __html: safeHighlight(item.location, locationMatches) }}
                  />
                </div>
              );
            }
          };
        }
        if (col.key === 'scanType') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDLog) => (
              <Badge variant="outline" className="text-center">
                {item.scanType.toUpperCase()}
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
            render: (item: RFIDLog) => (
              <div className="flex items-center gap-2 justify-center">
                {getStatusIcon(item.status)}
                {getStatusBadge(item.status)}
              </div>
            )
          };
        }
        if (col.key === 'timestamp') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDLog) => (
              <div className="flex items-center gap-1 justify-center">
                <Clock className="w-3 h-3" />
                <span className="text-sm text-blue-900">{item.timestamp}</span>
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
      render: (item: RFIDLog) => (
        <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Log"
                  className="hover:bg-blue-50"
                  onClick={() => {
                    setSelectedLog(item);
                    // Add view dialog logic here
                  }}
                >
                  <Eye className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                View details
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];

    return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="RFID Access Logs"
          subtitle="View and analyze RFID scan history and access records"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "RFID Management", href: "/rfid-management" },
            { label: "Access Logs" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<FileText className="text-blue-500 w-5 h-5" />}
            label="Total Logs"
            value={stats.total}
            valueClassName="text-blue-900"
            sublabel="Total number of logs"
          />
          <SummaryCard
            icon={<CheckCircle className="text-blue-500 w-5 h-5" />}
            label="Successful"
            value={stats.success}
            valueClassName="text-blue-900"
            sublabel="Successful scans"
          />
          <SummaryCard
            icon={<XCircle className="text-blue-500 w-5 h-5" />}
            label="Errors"
            value={stats.errors}
            valueClassName="text-blue-900"
            sublabel="Failed scans"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-blue-500 w-5 h-5" />}
            label="Unauthorized"
            value={stats.unauthorized}
            valueClassName="text-blue-900"
            sublabel="Unauthorized access"
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
                id: 'export-data',
                label: 'Export Data',
                description: 'Export logs to file',
                icon: <Download className="w-5 h-5 text-white" />,
                onClick: () => setExportDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print log list',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => {/* Add print logic */}
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
                description: 'Reload log data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: () => {/* Add refresh logic */},
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
                      <h3 className="text-lg font-bold text-white">RFID Access Logs</h3>
                      <p className="text-blue-100 text-sm">Search and filter RFID access logs</p>
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
                    placeholder="Search logs..."
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
                      <SelectItem value="success">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><CheckCircle className="w-4 h-4" /></span> Success
                        </span>
                      </SelectItem>
                      <SelectItem value="error">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><XCircle className="w-4 h-4" /></span> Error
                        </span>
                      </SelectItem>
                      <SelectItem value="unauthorized">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><AlertTriangle className="w-4 h-4" /></span> Unauthorized
                        </span>
                      </SelectItem>
                      <SelectItem value="timeout">
                        <span className="flex items-center gap-2">
                          <span className="text-yellow-500"><Clock className="w-4 h-4" /></span> Timeout
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={scanTypeFilter} onValueChange={setScanTypeFilter}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Scan Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="entry">Entry</SelectItem>
                      <SelectItem value="exit">Exit</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="access">Access</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="mt-2 sm:mt-3 px-2 sm:px-3 lg:px-6 max-w-full">
                <BulkActionsBar
                  selectedCount={selectedIds.length}
                  entityLabel="log"
                  actions={[
                    {
                      key: "bulk-actions",
                      label: "Bulk Actions",
                      icon: <Settings className="w-4 h-4 mr-2" />,
                      onClick: () => {/* Add bulk actions logic */},
                      tooltip: "Open enhanced bulk actions dialog",
                      variant: "default"
                    },
                    {
                      key: "export",
                      label: "Quick Export",
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: () => {/* Add export logic */},
                      tooltip: "Quick export selected logs to CSV"
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
                  {!loading && filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<FileText className="w-6 h-6 text-blue-400" />}
                        title="No RFID logs found"
                        description="Try adjusting your search criteria or filters to find the logs you're looking for."
                        action={
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={() => {/* Add refresh logic */}}
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
                      data={paginatedLogs}
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
              {/* Pagination */}
              <TablePagination
                page={currentPage}
                pageSize={itemsPerPage}
                totalItems={filteredLogs.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="log"
              />
            </div>
          </Card>
        </div>

        {/* Dialogs */}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortField={sortField}
          setSortField={field => setSortField(field as RFIDLogSortField)}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortFieldOptions={rfidLogSortFieldOptions}
          onApply={() => {
            setSortFields([{ field: sortField as SortField, order: sortOrder }]);
            setSortDialogOpen(false);
          }}
          onReset={() => {
            setSortField('timestamp');
            setSortOrder('desc');
            setSortFields([{ field: 'timestamp' as SortField, order: 'desc' }]);
            setSortDialogOpen(false);
          }}
          title="Sort RFID Logs"
          tooltip="Sort RFID logs by different fields. Choose the field and order to organize your list."
        />

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          exportableColumns={exportableColumnsForExport}
          exportColumns={exportableColumns.map(col => col.accessor)}
          setExportColumns={() => {}}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          onExport={() => {/* Add export logic */}}
          title="Export RFID Logs"
          tooltip="Export RFID log data in various formats. Choose your preferred export options."
        />

        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={COLUMN_OPTIONS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onReset={handleResetColumns}
          title="Manage RFID Log Columns"
          description="Choose which columns to display in the RFID log table"
          searchPlaceholder="Search RFID log columns..."
          enableManualSelection={true}
        />
      </div>
    </div>
  );
} 