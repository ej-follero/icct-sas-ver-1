"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { toast } from "sonner";
import Fuse from "fuse.js";
import React from "react";
import { Settings, Printer, Loader2, Upload, List, Columns3, ChevronDown, ChevronUp, RefreshCw, Download, Search, Bell, X, ChevronRight, FileText, Clock, MapPin, ScanLine, CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react";
import { ImportDialog } from "@/components/reusable/Dialogs/ImportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { PrintLayout } from '@/components/PrintLayout';
// removed unused TableCardView and TableRowActions
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
// removed unused ConfirmDeleteDialog
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// removed unused TableExpandedRow
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import PageHeader from '@/components/PageHeader/PageHeader';
// removed unused useDebounce
import { Card, CardHeader } from "@/components/ui/card";
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import BulkActionsDialog from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
// removed unused skeleton imports
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// removed unused useRouter
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
// removed unused Pagination, TableHeaderSection, useRef, and Table primitives
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

const rfidLogSortFieldOptions: { value: string; label: string }[] = [
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
  // removed unused router
  const [logs, setLogs] = useState<RFIDLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<RFIDLog | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
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
  const [locationSearch, setLocationSearch] = useState('');

  // Build unique location options from logs
  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    const source = Array.isArray(logs) ? logs : [];
    source.forEach(l => { if (l && (l as any).location) set.add((l as any).location as string); });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLocationOptions = useMemo(() => {
    const term = locationSearch.trim().toLowerCase();
    if (!term) return locationOptions;
    return locationOptions.filter(loc => loc.toLowerCase().includes(term));
  }, [locationOptions, locationSearch]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (scanTypeFilter && scanTypeFilter !== 'all') params.set('scanType', scanTypeFilter);
      if (locationFilter && locationFilter !== 'all') params.set('location', locationFilter);
      if (dateFilter) {
        // Compute local day boundaries and send to API
        const start = new Date(dateFilter);
        start.setHours(0,0,0,0);
        const end = new Date(dateFilter);
        end.setHours(23,59,59,999);
        params.set('start', start.toISOString());
        params.set('end', end.toISOString());
      }
      const res = await fetch(`/api/rfid/logs${params.toString() ? `?${params.toString()}` : ''}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed to fetch RFID logs (HTTP ${res.status})`);
      }
      const raw = await res.json();
      const data = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.items) ? raw.items : []));
      setLogs(data);
    } catch (e: any) {
      const message = e?.message || 'Failed to fetch RFID logs';
      setError(message);
      toast.error(message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Refresh logs whenever filter values change
  useEffect(() => {
    fetchLogs();
    setCurrentPage(1);
  }, [statusFilter, scanTypeFilter, locationFilter, dateFilter]);

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

    // Apply date filter (match YYYY-MM-DD prefix of timestamp)
    if (dateFilter) {
      const dayPrefix = dateFilter; // HTML date input returns YYYY-MM-DD
      filtered = filtered.filter(log => (log.timestamp || '').startsWith(dayPrefix));
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

  // Print current filtered logs
  const handlePrint = () => {
    const printColumns = [
      { header: 'Tag ID', accessor: 'tagId' },
      { header: 'Student', accessor: 'studentName' },
      { header: 'Reader ID', accessor: 'readerId' },
      { header: 'Location', accessor: 'location' },
      { header: 'Scan Type', accessor: 'scanType' },
      { header: 'Status', accessor: 'status' },
      { header: 'Timestamp', accessor: 'timestamp' },
    ];
    const printData = filteredLogs.map((l) => ({
      tagId: l.tagId,
      studentName: l.studentName || '',
      readerId: l.readerId,
      location: l.location,
      scanType: l.scanType,
      status: l.status,
      timestamp: l.timestamp,
    }));
    const printFn = PrintLayout({
      title: 'RFID Access Logs',
      data: printData,
      columns: printColumns,
      totalItems: filteredLogs.length,
    });
    printFn();
  };

  // Quick export selected logs to CSV
  const handleQuickExportSelectedLogs = () => {
    const selected = logs.filter(l => selectedIds.includes(l.id));
    if (selected.length === 0) {
      toast.error('No logs selected to export');
      return;
    }
    const headers = rfidLogColumns.map(col => col.label);
    const rows = selected.map((log) => {
      return rfidLogColumns.map(col => {
        const accessor = col.accessor as string;
        return String((log as any)[accessor] ?? '');
      });
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(v => {
      const s = String(v);
      return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfid-logs-selected.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} selected logs to CSV`);
  };

  const exportToCSV = (rows: RFIDLog[], columns: { id: string; label: string }[], filename: string) => {
    const headers = columns.map(c => c.label);
    const csvRows = rows.map((log) => {
      return columns.map(col => {
        const key = col.id as keyof RFIDLog;
        const value = (log as any)[key] ?? '';
        const s = String(value);
        return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToXLSX = async (rows: RFIDLog[], columns: { id: string; label: string }[], filename: string) => {
    try {
      const XLSX = await import('xlsx');
      const data = rows.map((log) => {
        const obj: Record<string, any> = {};
        columns.forEach(col => { obj[col.label] = (log as any)[col.id] ?? ''; });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RFID Logs');
      XLSX.writeFile(wb, filename);
    } catch (e) {
      toast.error('XLSX export not available. Falling back to CSV.');
      exportToCSV(rows, columns, filename.replace(/\.xlsx$/, '.csv'));
    }
  };

  const exportToPDF = async (rows: RFIDLog[], columns: { id: string; label: string }[], filename: string) => {
    try {
      const jsPDFModule = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const doc = new jsPDFModule.jsPDF();
      const head = [columns.map(c => c.label)];
      const body = rows.map(log => columns.map(c => String((log as any)[c.id] ?? '')));
      // @ts-ignore
      autoTableModule.default(doc, { head, body, styles: { fontSize: 8 } });
      doc.save(filename);
    } catch (e) {
      // Fallback to print layout if jsPDF is not available
      const printColumns = columns.map(c => ({ header: c.label, accessor: c.id }));
      const printData = rows.map((log) => {
        const obj: Record<string, any> = {};
        columns.forEach(col => { obj[col.id] = (log as any)[col.id] ?? ''; });
        return obj;
      });
      const printFn = PrintLayout({ title: 'RFID Access Logs', data: printData, columns: printColumns, totalItems: rows.length });
      printFn();
      toast.message('Opened print dialog as PDF fallback');
    }
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

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const success = filteredLogs.filter(l => l.status === 'success').length;
    const errors = filteredLogs.filter(l => l.status === 'error').length;
    const unauthorized = filteredLogs.filter(l => l.status === 'unauthorized').length;
    const dayPrefix = dateFilter || new Date().toISOString().slice(0, 10);
    const today = filteredLogs.filter(l => (l.timestamp || '').startsWith(dayPrefix)).length;
    return { total, success, errors, unauthorized, today };
  }, [filteredLogs, dateFilter]);

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
        // Simple insights and raw JSON for ops/triage
        const allForTag = logs.filter(l => l.tagId === item.tagId);
        const sorted = [...allForTag].sort((a,b) => (a.timestamp||'') < (b.timestamp||'') ? -1 : 1);
        const idx = sorted.findIndex(l => l.id === item.id);
        const prev = idx > 0 ? sorted[idx-1] : undefined;
        const next = idx >= 0 && idx < sorted.length-1 ? sorted[idx+1] : undefined;
        const now = new Date(item.timestamp).getTime();
        const in24h = logs.filter(l => l.tagId === item.tagId && Math.abs(new Date(l.timestamp).getTime() - now) <= 24*60*60*1000);
        const failures = in24h.filter(l => l.status !== 'success');
        const copy = (t: string) => { try { navigator.clipboard.writeText(t); toast.success('Copied'); } catch {} };
        return (
          <td colSpan={columns.length} className="p-0">
            <div className="bg-blue-50/60 px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Insights</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Tag ID:</span> {item.tagId}</div>
                    <div><span className="font-medium">Reader ID:</span> {item.readerId}</div>
                    <div><span className="font-medium">24h scans (same tag):</span> {in24h.length}</div>
                    <div><span className="font-medium">24h failures:</span> {failures.length}</div>
                    <div><span className="font-medium">Previous scan:</span> {prev ? new Date(prev.timestamp).toLocaleString() : '—'}</div>
                    <div><span className="font-medium">Next scan:</span> {next ? new Date(next.timestamp).toLocaleString() : '—'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Raw Event</h4>
                  <pre className="text-xs bg-white border border-blue-100 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(item, null, 2)}</pre>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded" onClick={() => copy(item.tagId)}>Copy Tag ID</Button>
                    <Button variant="outline" size="sm" className="rounded" onClick={() => copy(JSON.stringify(item))}>Copy JSON</Button>
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
                <span 
                  className="text-sm text-blue-900"
                  dangerouslySetInnerHTML={{ __html: safeHighlight(item.location, locationMatches) }}
                />
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
                {String(item?.scanType ?? '').toUpperCase() || 'N/A'}
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
              <span className="text-sm text-blue-900">{item.timestamp}</span>
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

        {error && (
          <div className="w-full max-w-full">
            <div className="flex items-start justify-between p-3 sm:p-4 border border-red-200 bg-red-50 text-red-800 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold">Failed to load logs</div>
                  <div className="text-sm">{error}</div>
                </div>
              </div>
              <button
                aria-label="Dismiss error"
                className="text-red-700 hover:text-red-900"
                onClick={() => setError(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
                id: 'import-data',
                label: 'Import Data',
                description: 'Import logs from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
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
                description: 'Reload log data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: async () => {
                  try {
                    setIsRefreshing(true);
                    await fetchLogs();
                  } finally {
                    setIsRefreshing(false);
                  }
                },
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700 rounded">
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
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700 rounded">
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
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full sm:w-36 lg:w-40 xl:w-36 text-gray-700 rounded">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent className="w-60">
                      <div className="p-2 sticky top-0 bg-white/95 backdrop-blur z-10">
                        <input
                          type="text"
                          placeholder="Search locations..."
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <SelectItem value="all">All Locations</SelectItem>
                        {filteredLocationOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                        ) : (
                          filteredLocationOptions.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
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
                      onClick: () => setBulkActionsDialogOpen(true),
                      tooltip: "Open enhanced bulk actions dialog",
                      variant: "default"
                    },
                    {
                      key: "export",
                      label: "Quick Export",
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: () => handleQuickExportSelectedLogs(),
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
                              onClick={async () => {
                                try {
                                  setIsRefreshing(true);
                                  await fetchLogs();
                                } finally {
                                  setIsRefreshing(false);
                                }
                              }}
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
        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={(Array.isArray(logs) ? logs : []).filter(l => l && selectedIds.includes(l.id)).filter(Boolean)}
          entityType="rfidLog"
          entityLabel="log"
          availableActions={[
            { id: 'notification', label: 'Send Notification', description: 'Notify administrators about selected logs', icon: <Bell className="w-4 h-4" />, tabId: 'notification' },
            { id: 'export', label: 'Export Data', description: 'Export selected logs data', icon: <Download className="w-4 h-4" />, tabId: 'export' },
          ]}
          onActionComplete={(actionType, results) => {
            toast.success(`Bulk action '${actionType}' completed.`);
            setBulkActionsDialogOpen(false);
          }}
          onCancel={() => setBulkActionsDialogOpen(false)}
          onProcessAction={async (actionType, config) => {
            try {
              if (actionType === 'notification') {
                const { itemId, subject, message, priority, includeAttachments } = config || {};
                if (!itemId || !subject || !message) return { success: false };
                await fetch(`/api/notifications/logs`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ logId: itemId, subject, message, priority, includeAttachments })
                }).catch(() => {});
                return { success: true };
              }
              if (actionType === 'export') {
                // Handled by dialog; we simply acknowledge success
                return { success: true };
              }
              return { success: false };
            } catch {
              return { success: false };
            }
          }}
          getItemId={(item) => item.id}
          getItemDisplayName={(item) => String(item?.tagId ?? '')}
          getItemStatus={(item) => String(item?.status ?? '')}
        />

        {selectedLog && (
          <ViewDialog
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            title="Log Details"
            subtitle={`${(String(selectedLog?.scanType ?? '').toUpperCase() || 'LOG')} at ${selectedLog?.location ?? ''}`}
            sections={[
              {
                title: 'Log Information',
                fields: [
                  { label: 'Tag ID', value: selectedLog.tagId },
                  { label: 'Reader ID', value: selectedLog.readerId },
                  { label: 'Location', value: selectedLog.location },
                  { label: 'Status', value: selectedLog.status },
                  { label: 'Scan Type', value: selectedLog.scanType },
                  { label: 'Timestamp', value: selectedLog.timestamp },
                ]
              },
              {
                title: 'Subject',
                fields: [
                  { label: 'Student ID', value: selectedLog.studentId || '—' },
                  { label: 'Student Name', value: selectedLog.studentName || '—' },
                  { label: 'Duration (min)', value: selectedLog.duration ? String(selectedLog.duration) : '—' },
                  { label: 'Notes', value: selectedLog.notes || '—' },
                ]
              }
            ]}
            tooltipText="View detailed RFID log information"
          />
        )}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortOptions={rfidLogSortFieldOptions}
          currentSort={{ field: sortField, order: sortOrder }}
          onSortChange={(field, order) => {
            setSortField(field as RFIDLogSortField);
            setSortOrder(order as RFIDLogSortOrder);
            setSortFields([{ field: field as SortField, order }]);
          }}
          title="Sort RFID Logs"
          description="Sort RFID logs by different fields. Choose the field and order to organize your list."
          entityType="rfid_logs"
        />

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          dataCount={selectedIds.length > 0 ? selectedIds.length : filteredLogs.length}
          entityType="rfidLog"
          onExport={async (format, options) => {
            try {
              const cols = (options.selectedColumns || []).map((key: string) => {
                const found = rfidLogColumns.find(col => col.key === key);
                return found ? { id: found.key, label: found.label } : null;
              }).filter(Boolean) as { id: string; label: string }[];
              const dataSource = selectedIds.length > 0 ? logs.filter(l => selectedIds.includes(l.id)) : filteredLogs;
              if (dataSource.length === 0) {
                toast.error('No data to export');
                return;
              }
              if (format === 'csv') {
                exportToCSV(dataSource, cols, 'rfid-logs.csv');
              } else if (format === 'excel') {
                await exportToXLSX(dataSource, cols, 'rfid-logs.xlsx');
              } else if (format === 'pdf') {
                await exportToPDF(dataSource, cols, 'rfid-logs.pdf');
              }
              toast.success(`Exported ${dataSource.length} record(s) to ${format.toUpperCase()}`);
            } catch (e: any) {
              toast.error(e?.message || 'Failed to export logs');
            }
          }}
        />

        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={async (records: any[]) => {
            try {
              // Basic client-side validation aligned with RFIDLogs schema
              const required = ['rfidTag','readerId','scanType','scanStatus','location','timestamp','userId','userRole'];
              const invalid: number[] = [];
              const normalized = records.map((r: any, idx: number) => {
                const rec: any = {
                  rfidTag: r.rfidTag ?? r.tagId ?? r.tag ?? '',
                  readerId: Number(r.readerId ?? 0),
                  scanType: r.scanType ?? 'CHECK_IN',
                  scanStatus: r.scanStatus ?? 'SUCCESS',
                  location: r.location ?? '',
                  timestamp: r.timestamp ?? new Date().toISOString(),
                  userId: Number(r.userId ?? 0),
                  userRole: r.userRole ?? 'STUDENT',
                };
                const missing = required.some(k => rec[k] === undefined || rec[k] === null || rec[k] === '' || (k.endsWith('Id') && isNaN(Number(rec[k]))));
                if (missing) invalid.push(idx + 1);
                return rec;
              });
              if (invalid.length > 0) {
                throw new Error(`Invalid rows: ${invalid.join(', ')}. Ensure required columns are present and correctly typed.`);
              }
              const res = await fetch('/api/rfid/logs/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: normalized, options: { skipDuplicates: true, updateExisting: true } })
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || `Import failed (HTTP ${res.status})`);
              }
              const result = await res.json().catch(() => ({}));
              await fetchLogs();
              toast.success('Logs imported successfully');
              return {
                success: result?.results?.success ?? 0,
                failed: result?.results?.failed ?? 0,
                errors: result?.results?.errors ?? []
              };
            } catch (e: any) {
              toast.error(e?.message || 'Failed to import logs');
              return { success: 0, failed: records.length, errors: [e?.message || 'Unknown import error'] };
            }
          }}
          entityName="RFIDLog"
          templateUrl="/api/rfid/logs/template"
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={5}
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