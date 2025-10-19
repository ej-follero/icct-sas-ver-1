'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Wifi, Shield, Activity, Plus, Edit, Trash2, RefreshCw, Search, Bell, Download, Upload, Printer, Columns3, List, Eye, Pencil, RotateCcw, X, Clock, Info, UserCheck, UserX, Building2, Hash, Tag, Layers, FileText, BadgeInfo, AlertTriangle, WifiOff, CreditCard, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { EmptyState } from '@/components/reusable';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import BulkActionsDialog from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { ImportDialog } from '@/components/reusable/Dialogs/ImportDialog';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { Checkbox } from '@/components/ui/checkbox';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { useDebounce } from '@/hooks/use-debounce';

interface RFIDReader {
  id: string;
  deviceId: string;
  deviceName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  ipAddress: string;
  lastSeen: string;
  roomId?: number;
  roomName?: string;
  tags: number;
  readRate: number;
  components: any;
  notes?: string;
}

interface RFIDConfig {
  systemEnabled: boolean;
  autoDiscovery: boolean;
  encryptionEnabled: boolean;
  dataRetentionDays: number;
  scanIntervalMs: number;
  maxConcurrentScans: number;
  alertThreshold: number;
}

export default function RFIDConfigPage() {
  // State management
  const [config, setConfig] = useState<RFIDConfig>({
    systemEnabled: true,
    autoDiscovery: true,
    encryptionEnabled: true,
    dataRetentionDays: 90,
    scanIntervalMs: 1000,
    maxConcurrentScans: 10,
    alertThreshold: 80
  });
  
  const [readers, setReaders] = useState<RFIDReader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedReader, setSelectedReader] = useState<RFIDReader | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<'deviceName' | 'status' | 'readRate' | 'lastSeen'>('deviceName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<{ deviceName: string; ipAddress: string; status: RFIDReader['status']; roomId?: string; notes?: string }>({ deviceName: '', ipAddress: '', status: 'ACTIVE', roomId: undefined, notes: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'deviceName', 'status', 'readRate', 'tags', 'roomName', 'lastSeen'
  ]);

  // Derived room options (id + display name)
  const roomOptions = useMemo(() => {
    const map = new Map<string, string>();
    const list = Array.isArray(readers) ? readers : [];
    list.forEach(r => {
      if (r && (r as any).roomId) {
        const rid = String((r as any).roomId);
        const rname = (r as any).roomName || rid;
        map.set(rid, rname);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [readers]);

  // Column definitions
  const readerColumns = [
    { key: 'deviceName', label: 'Device Name', accessor: 'deviceName', className: 'text-blue-900', sortable: true },
    { key: 'deviceId', label: 'Device ID', accessor: 'deviceId', className: 'text-blue-900', sortable: true },
    { key: 'status', label: 'Status', accessor: 'status', className: 'text-center', sortable: true },
    { key: 'readRate', label: 'Read Rate', accessor: 'readRate', className: 'text-center text-blue-900', sortable: true },
    { key: 'tags', label: 'Active Tags', accessor: 'tags', className: 'text-center text-blue-900', sortable: true },
    { key: 'roomName', label: 'Location', accessor: 'roomName', className: 'text-blue-900', sortable: true },
    { key: 'lastSeen', label: 'Last Seen', accessor: 'lastSeen', className: 'text-center text-blue-900', sortable: true },
  ];

  const COLUMN_OPTIONS: ColumnOption[] = readerColumns.map(col => ({
    accessor: col.key,
    header: col.label,
    description: undefined,
    category: 'Reader Info',
    required: col.key === 'deviceName' || col.key === 'status',
  }));

  const sortFieldOptions: { value: string; label: string }[] = [
    { value: 'deviceName', label: 'Device Name' },
    { value: 'deviceId', label: 'Device ID' },
    { value: 'status', label: 'Status' },
    { value: 'readRate', label: 'Read Rate' },
    { value: 'tags', label: 'Active Tags' },
    { value: 'roomName', label: 'Location' },
    { value: 'lastSeen', label: 'Last Seen' },
  ];

  // Load data from API
  const fetchReaders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchInput) params.set('search', searchInput);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (roomFilter && roomFilter !== 'all') params.set('room', roomFilter);
      params.set('page', String(currentPage));
      params.set('pageSize', String(itemsPerPage));
      params.set('sortBy', sortField);
      params.set('sortDir', sortOrder);
      const res = await fetch(`/api/rfid/readers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch readers');
      const raw = await res.json();
      const rows = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const mapped: RFIDReader[] = rows.map((r: any) => ({
        id: String(r.readerId ?? r.id ?? r.deviceId),
        deviceId: r.deviceId,
        deviceName: r.deviceName || '',
        status: (r.status || 'ACTIVE') as RFIDReader['status'],
        ipAddress: r.ipAddress || '',
        lastSeen: (r.lastSeen ? new Date(r.lastSeen).toISOString() : new Date().toISOString()),
        roomId: r.roomId,
        roomName: r.roomName || r.room?.roomNo || undefined,
        tags: r.tags ?? 0,
        readRate: r.readRate ?? 0,
        components: r.components ?? {},
        notes: r.notes || undefined,
      }));
      setReaders(mapped);
      const total = typeof raw?.total === 'number' ? raw.total : mapped.length;
      setTotalCount(total);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load RFID readers';
      setError(msg);
      toast.error(msg);
      setReaders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReaders();
  }, [searchInput, statusFilter, roomFilter, currentPage, itemsPerPage, sortField, sortOrder]);

  // Server-side filtering/sorting/pagination: use readers as-is
  const filteredReaders = readers;

  // Pagination
  const paginatedReaders = filteredReaders;

  const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);

  // Selection handlers
  const isAllSelected = paginatedReaders.length > 0 && paginatedReaders.every(r => selectedIds.includes(r.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedReaders.map(r => r.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Expanded rows toggle
  const onToggleExpand = (itemId: string) => {
    setExpandedRowIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  };

  // Configuration handlers
  const handleConfigChange = (key: keyof RFIDConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} updated successfully`);
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchReaders();
      if (!error) toast.success('RFID readers refreshed');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export helpers
  const exportToCSV = (rows: RFIDReader[], columns: { id: string; label: string }[], filename: string) => {
    const headers = columns.map(c => c.label);
    const csvRows = rows.map((row) => {
      return columns.map(col => {
        const value = (row as any)[col.id] ?? '';
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

  const exportToXLSX = async (rows: RFIDReader[], columns: { id: string; label: string }[], filename: string) => {
    try {
      const XLSX = await import('xlsx');
      const data = rows.map((r) => {
        const obj: Record<string, any> = {};
        columns.forEach(col => { obj[col.label] = (r as any)[col.id] ?? ''; });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RFID Readers');
      XLSX.writeFile(wb, filename);
    } catch (e) {
      toast.error('XLSX export not available. Falling back to CSV.');
      exportToCSV(rows, columns, filename.replace(/\.xlsx$/, '.csv'));
    }
  };

  const exportToPDF = async (rows: RFIDReader[], columns: { id: string; label: string }[], filename: string) => {
    try {
      const jsPDFModule = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const doc = new jsPDFModule.jsPDF();
      const head = [columns.map(c => c.label)];
      const body = rows.map(row => columns.map(c => String((row as any)[c.id] ?? '')));
      // @ts-ignore
      autoTableModule.default(doc, { head, body, styles: { fontSize: 8 } });
      doc.save(filename);
    } catch (e) {
      toast.error('PDF export not available.');
    }
  };

  // Table columns
  const columns: TableListColumn<RFIDReader>[] = [
    {
      header: '',
      accessor: 'expander',
      className: 'w-10 text-center px-1 py-1',
      render: (item: RFIDReader) => (
        <button
          onClick={() => onToggleExpand(item.id)}
          className="px-2 py-1 rounded-full hover:bg-gray-200 text-center"
          aria-label={expandedRowIds.includes(item.id) ? 'Collapse row' : 'Expand row'}
        >
          {expandedRowIds.includes(item.id) ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />}
        </button>
      ),
      expandedContent: (item: RFIDReader) => {
        const copy = (t: string) => { try { navigator.clipboard.writeText(t); toast.success('Copied'); } catch {} };
        return (
          <td colSpan={columns.length} className="p-0">
            <div className="bg-blue-50/60 px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Technical</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Device ID:</span> {item.deviceId}</div>
                    <div><span className="font-medium">IP Address:</span> {item.ipAddress || '—'}</div>
                    <div><span className="font-medium">Room:</span> {item.roomName || item.roomId || '—'}</div>
                    <div><span className="font-medium">Last Seen:</span> {item.lastSeen ? new Date(item.lastSeen).toLocaleString() : '—'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Components JSON</h4>
                  <pre className="text-xs bg-white border border-blue-100 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(item.components, null, 2)}</pre>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded" onClick={() => copy(item.deviceId)}>Copy Device ID</Button>
                    <Button variant="outline" size="sm" className="rounded" onClick={() => copy(JSON.stringify(item))}>Copy Row JSON</Button>
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
        <Checkbox 
          checked={isAllSelected} 
          indeterminate={isIndeterminate} 
          onCheckedChange={handleSelectAll}
          aria-label="Select all readers"
        />
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    ...readerColumns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => {
        if (col.key === 'status') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDReader) => (
              <Badge 
                variant={
                  item.status === "ACTIVE" ? "success" : 
                  item.status === "INACTIVE" ? "destructive" : 
                  "secondary"
                } 
                className="text-center"
              >
                {item.status}
              </Badge>
            )
          };
        }
        if (col.key === 'readRate') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDReader) => (
              <div className="text-center">
                <div className="text-lg font-bold">{item.readRate}%</div>
                <div className="text-xs text-gray-600">read rate</div>
              </div>
            )
          };
        }
        if (col.key === 'lastSeen') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: RFIDReader) => (
              <div className="text-center">
                <div className="text-sm">{new Date(item.lastSeen).toLocaleDateString()}</div>
                <div className="text-xs text-gray-600">{new Date(item.lastSeen).toLocaleTimeString()}</div>
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
      render: (item: RFIDReader) => (
        <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Reader"
                  className="hover:bg-blue-50"
                  onClick={() => {
                    setSelectedReader(item);
                    setViewDialogOpen(true);
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
                  aria-label="Edit Reader"
                  className="hover:bg-green-50"
                  onClick={() => {
                    setSelectedReader(item);
                  setEditForm({ deviceName: item.deviceName, ipAddress: item.ipAddress, status: item.status, roomId: item.roomId ? String(item.roomId) : undefined, notes: item.notes });
                  setEditDialogOpen(true);
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
                  aria-label="Delete Reader"
                  className="hover:bg-red-50"
                  onClick={() => {
                    setSelectedReader(item);
                  setDeleteDialogOpen(true);
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

  // Summary statistics
  const summary = {
    total: readers.length,
    active: readers.filter(r => r.status === 'ACTIVE').length,
    inactive: readers.filter(r => r.status === 'INACTIVE').length,
    maintenance: readers.filter(r => r.status === 'MAINTENANCE').length,
    totalTags: readers.reduce((sum, r) => sum + r.tags, 0),
    avgReadRate: readers.length > 0 ? (readers.reduce((sum, r) => sum + r.readRate, 0) / readers.length).toFixed(1) : '0'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="RFID Configuration"
          subtitle="Manage RFID system settings, readers, and system configuration"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "RFID Management", href: "/list/rfid" },
            { label: "Configuration" }
          ]}
        />

        {/* Edit Reader Dialog */}
        {selectedReader && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[560px] p-0 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditDialogOpen(false)}
                  className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="text-xl font-bold text-white mb-1">Edit Reader</DialogTitle>
                  <p className="text-blue-100">Update reader information and save changes.</p>
                </div>
              </div>
              <div className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="edit-device-name">Device Name</Label>
                  <Input id="edit-device-name" value={editForm.deviceName} onChange={(e) => setEditForm(prev => ({ ...prev, deviceName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ip">IP Address</Label>
                  <Input id="edit-ip" value={editForm.ipAddress} onChange={(e) => setEditForm(prev => ({ ...prev, ipAddress: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v as RFIDReader['status'] }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Select value={editForm.roomId} onValueChange={(v) => setEditForm(prev => ({ ...prev, roomId: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomOptions.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input id="edit-notes" value={editForm.notes || ''} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter className="px-6 py-4 bg-gray-50/50 border-t border-gray-200">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded" disabled={isSavingEdit}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!selectedReader) return;
                    setIsSavingEdit(true);
                    try {
                      const res = await fetch(`/api/rfid/readers/${selectedReader.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          deviceName: editForm.deviceName,
                          ipAddress: editForm.ipAddress,
                          status: editForm.status,
                          roomId: editForm.roomId ? Number(editForm.roomId) : undefined,
                          notes: editForm.notes,
                        })
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err?.error || 'Failed to update reader');
                      }
                      const updated = await res.json();
                      setReaders(prev => prev.map(r => r.id === selectedReader.id ? { ...r, ...updated, id: selectedReader.id } : r));
                      toast.success('Reader updated successfully');
                      setEditDialogOpen(false);
                      setSelectedReader(null);
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to update reader');
                    } finally {
                      setIsSavingEdit(false);
                    }
                  }}
                  disabled={isSavingEdit || !editForm.deviceName}
                  className="bg-blue-600 hover:bg-blue-700 rounded"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Wifi className="text-blue-500 w-5 h-5" />}
            label="System Status"
            value={config.systemEnabled ? 'Active' : 'Inactive'}
            valueClassName="text-blue-900"
            sublabel={`${summary.active} of ${summary.total} readers online`}
          />
          <SummaryCard
            icon={<CreditCard className="text-blue-500 w-5 h-5" />}
            label="Active Tags"
            value={summary.totalTags}
            valueClassName="text-blue-900"
            sublabel="Total RFID tags in use"
          />
          <SummaryCard
            icon={<Shield className="text-blue-500 w-5 h-5" />}
            label="Read Rate"
            value={`${summary.avgReadRate}%`}
            valueClassName="text-blue-900"
            sublabel="Average across readers"
          />
          <SummaryCard
            icon={<Settings className="text-blue-500 w-5 h-5" />}
            label="System Health"
            value="85%"
            valueClassName="text-blue-900"
            sublabel="Good condition"
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
                id: 'refresh-config',
                label: 'Refresh Config',
                description: 'Reload configuration data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-white" />
                ),
                onClick: handleRefresh,
                disabled: isRefreshing,
                loading: isRefreshing
              },
              {
                id: 'export-data',
                label: 'Export Data',
                description: 'Export reader data',
                icon: <Download className="w-5 h-5 text-white" />,
                onClick: () => setExportDialogOpen(true)
              },
              {
                id: 'import-data',
                label: 'Import Readers',
                description: 'Import readers from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print configuration',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => toast.info('Print functionality coming soon')
              },
              {
                id: 'visible-columns',
                label: 'Visible Columns',
                description: 'Manage table columns',
                icon: <Columns3 className="w-5 h-5 text-white" />,
                onClick: () => setVisibleColumnsDialogOpen(true)
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

        {/* System Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {error && (
            <div className="lg:col-span-2">
              <div className="flex items-start justify-between p-3 sm:p-4 border border-red-200 bg-red-50 text-red-800 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5" />
                  <div>
                    <div className="font-semibold">Failed to load readers</div>
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
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 lg:col-span-1">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white px-6 py-6">
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">System Enabled</Label>
                    <p className="text-xs text-gray-600">Enable/disable RFID system</p>
                  </div>
                  <Switch 
                    checked={config.systemEnabled} 
                    onCheckedChange={(checked) => handleConfigChange('systemEnabled', checked)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Auto Discovery</Label>
                    <p className="text-xs text-gray-600">Automatically detect new readers</p>
                  </div>
                  <Switch 
                    checked={config.autoDiscovery} 
                    onCheckedChange={(checked) => handleConfigChange('autoDiscovery', checked)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Encryption</Label>
                    <p className="text-xs text-gray-600">Enable data encryption</p>
                  </div>
                  <Switch 
                    checked={config.encryptionEnabled} 
                    onCheckedChange={(checked) => handleConfigChange('encryptionEnabled', checked)} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Data Retention (Days)</Label>
                    <p className="text-xs text-gray-600">How long to keep scan data</p>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{config.dataRetentionDays}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Scan Interval (ms)</Label>
                    <p className="text-xs text-gray-600">Time between scans</p>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{config.scanIntervalMs}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Max Concurrent Scans</Label>
                    <p className="text-xs text-gray-600">Maximum simultaneous scans</p>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{config.maxConcurrentScans}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Alert Threshold (%)</Label>
                    <p className="text-xs text-gray-600">Read rate alert level</p>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{config.alertThreshold}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RFID Readers Management */}
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 lg:col-span-3">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white px-6 py-6">
              <CardTitle className="flex items-center gap-2 text-white">
                <Wifi className="w-5 h-5" />
                RFID Readers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-end">
                  <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto items-center">
                    <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm order-1 xl:order-none">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search readers..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700 rounded">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={roomFilter} onValueChange={setRoomFilter}>
                      <SelectTrigger className="w-full sm:w-32 lg:w-40 xl:w-40 text-gray-700 rounded">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {roomOptions.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Readers Table */}
              <div className="overflow-x-auto">
                {!loading && filteredReaders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <EmptyState
                      icon={<Wifi className="w-6 h-6 text-blue-400" />}
                      title="No readers found"
                      description="Try adjusting your search criteria or filters to find the readers you're looking for."
                      action={
                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                            onClick={handleRefresh}
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
                    data={paginatedReaders}
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
                  />
                )}
              </div>

              {/* Pagination */}
              <TablePagination
                page={currentPage}
                pageSize={itemsPerPage}
                totalItems={filteredReaders.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="reader"
              />
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <ViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          title={selectedReader ? `${selectedReader.deviceName}` : "Reader Details"}
          subtitle={selectedReader?.deviceId}
          status={selectedReader ? {
            value: selectedReader.status,
            variant: selectedReader.status === "ACTIVE" ? "success" : 
                    selectedReader.status === "INACTIVE" ? "destructive" : "secondary"
          } : undefined}
          headerVariant="default"
          sections={selectedReader ? ([
            {
              title: "Reader Information",
              fields: [
                { label: 'Device ID', value: selectedReader.deviceId, icon: <Hash className="w-4 h-4 text-blue-600" /> },
                { label: 'Device Name', value: selectedReader.deviceName, icon: <Wifi className="w-4 h-4 text-blue-600" /> },
                { label: 'IP Address', value: selectedReader.ipAddress, icon: <Tag className="w-4 h-4 text-blue-600" /> },
                { label: 'Location', value: selectedReader.roomName || 'Not assigned', icon: <Building2 className="w-4 h-4 text-blue-600" /> },
                { label: 'Status', value: selectedReader.status, icon: <Info className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Performance Metrics",
              fields: [
                { label: 'Active Tags', value: String(selectedReader.tags), icon: <CreditCard className="w-4 h-4 text-blue-600" /> },
                { label: 'Read Rate', value: `${selectedReader.readRate}%`, icon: <Activity className="w-4 h-4 text-blue-600" /> },
                { label: 'Last Seen', value: new Date(selectedReader.lastSeen).toLocaleString(), icon: <Clock className="w-4 h-4 text-blue-600" /> },
              ]
            }
          ]) : []}
          description={selectedReader?.roomName ? `Location: ${selectedReader.roomName}` : undefined}
          tooltipText="View detailed reader information"
        />

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setSelectedReader(null);
          }}
          itemName={selectedReader?.deviceName}
          onDelete={async () => { 
            if (!selectedReader) return;
            try {
              const res = await fetch(`/api/rfid/readers/${selectedReader.id}`, { method: 'DELETE' });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || 'Failed to delete reader');
              }
              setReaders(prev => prev.filter(r => r.id !== selectedReader.id));
              setSelectedIds(prev => prev.filter(id => id !== selectedReader.id));
              toast.success('Reader deleted successfully');
            } catch (e: any) {
              toast.error(e?.message || 'Failed to delete reader');
            } finally {
              setDeleteDialogOpen(false);
              setSelectedReader(null);
            }
          }}
          onCancel={() => { setDeleteDialogOpen(false); setSelectedReader(null); }}
          canDelete={true}
          deleteError={undefined}
          description={selectedReader ? `Are you sure you want to delete the reader "${selectedReader.deviceName}"? This action cannot be undone.` : undefined}
        />

        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortOptions={sortFieldOptions}
          currentSort={{ field: sortField, order: sortOrder }}
          onSortChange={(field, order) => {
            setSortField(field as 'deviceName' | 'status' | 'readRate' | 'lastSeen');
            setSortOrder(order);
          }}
          title="Sort Readers"
          description="Sort readers by different fields. Choose the field and order to organize your list."
          entityType="readers"
        />

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          dataCount={readers.length}
          entityType="reader"
          onExport={async (format, options) => {
            try {
              const cols = (options.selectedColumns || []).map((key: string) => {
                const found = readerColumns.find(col => col.key === key);
                return found ? { id: found.key, label: found.label } : null;
              }).filter(Boolean) as { id: string; label: string }[];
              const dataSource = readers;
              if (dataSource.length === 0) {
                toast.error('No data to export');
                return;
              }
              if (format === 'csv') {
                exportToCSV(dataSource as any, cols, 'rfid-readers.csv');
              } else if (format === 'excel') {
                await exportToXLSX(dataSource as any, cols, 'rfid-readers.xlsx');
              } else if (format === 'pdf') {
                await exportToPDF(dataSource as any, cols, 'rfid-readers.pdf');
              }
              toast.success(`Exported ${dataSource.length} record(s) to ${format.toUpperCase()}`);
            } catch (e: any) {
              toast.error(e?.message || 'Failed to export readers');
            }
          }}
        />

        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={COLUMN_OPTIONS}
          visibleColumns={visibleColumns}
          onColumnToggle={(columnAccessor, checked) => {
            setVisibleColumns(prev => {
              if (checked) {
                return prev.includes(columnAccessor) ? prev : [...prev, columnAccessor];
              } else {
                if (COLUMN_OPTIONS.find(col => col.accessor === columnAccessor)?.required) return prev;
                return prev.filter(col => col !== columnAccessor);
              }
            });
          }}
          onReset={() => {
            setVisibleColumns(readerColumns.map(col => col.key));
            toast.success('Column visibility reset to default');
          }}
          title="Manage Reader Columns"
          description="Choose which columns to display in the reader table"
          searchPlaceholder="Search reader columns..."
          enableManualSelection={true}
        />

        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={async (records: any[]) => {
            try {
              // Basic validation
              const required = ['deviceId'];
              const invalid: number[] = [];
              const normalized = records.map((r: any, idx: number) => {
                const rec: any = {
                  deviceId: r.deviceId,
                  deviceName: r.deviceName,
                  roomId: r.roomId,
                  status: r.status || 'ACTIVE',
                  ipAddress: r.ipAddress,
                  notes: r.notes,
                };
                if (!rec.deviceId) invalid.push(idx + 1);
                return rec;
              });
              if (invalid.length > 0) throw new Error(`Invalid rows: ${invalid.join(', ')}`);
              const res = await fetch('/api/rfid/readers/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: normalized })
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || `Import failed (HTTP ${res.status})`);
              }
              const result = await res.json();
              await fetchReaders();
              toast.success('Readers imported successfully');
              return {
                success: result?.results?.success ?? 0,
                failed: result?.results?.failed ?? 0,
                errors: result?.results?.errors ?? []
              };
            } catch (e: any) {
              toast.error(e?.message || 'Failed to import readers');
              return { success: 0, failed: records.length, errors: [e?.message || 'Unknown import error'] };
            }
          }}
          entityName="RFIDReader"
          templateUrl="/api/rfid/readers/template"
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={5}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={readers.filter(reader => selectedIds.includes(reader.id))}
          entityType="reader"
          entityLabel="reader"
          availableActions={[
            { id: 'status-update', label: 'Update Status', description: 'Update status of selected readers', icon: <Settings className="w-4 h-4" />, tabId: 'status' },
            { id: 'notification', label: 'Send Notification', description: 'Send notification to administrators', icon: <Bell className="w-4 h-4" />, tabId: 'notification' },
            { id: 'export', label: 'Export Data', description: 'Export selected readers data', icon: <Download className="w-4 h-4" />, tabId: 'export' },
          ]}
          onActionComplete={(actionType: string, results: any) => {
            toast.success(`Bulk action '${actionType}' completed.`);
            setBulkActionsDialogOpen(false);
            fetchReaders();
          }}
          onCancel={() => setBulkActionsDialogOpen(false)}
          onProcessAction={async (actionType: string, config: any) => {
            try {
              if (actionType === 'status-update') {
                const { itemId, newStatus, reason } = config || {};
                if (!itemId || !newStatus) return { success: false };
                const res = await fetch(`/api/rfid/readers/${itemId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: String(newStatus).toUpperCase(), reason })
                });
                if (!res.ok) return { success: false };
                const updated = await res.json().catch(() => ({}));
                setReaders(prev => prev.map(r => r.id === String(itemId) ? { ...r, ...updated, status: String(newStatus).toUpperCase() as RFIDReader['status'] } : r));
                return { success: true };
              }
              if (actionType === 'notification') {
                // Placeholder - integrate with your notifications module if present
                return { success: true };
              }
              if (actionType === 'export') {
                return { success: true };
              }
              return { success: false };
            } catch {
              return { success: false };
            }
          }}
          getItemDisplayName={(item: RFIDReader) => item.deviceName}
          getItemStatus={(item: RFIDReader) => item.status}
          getItemId={(item: RFIDReader) => item.id}
        />
      </div>
    </div>
  );
} 