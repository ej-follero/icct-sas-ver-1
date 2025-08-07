'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Wifi, Shield, Activity, Plus, Edit, Trash2, RefreshCw, Search, Bell, Download, Upload, Printer, Columns3, List, Eye, Pencil, RotateCcw, X, Clock, Info, UserCheck, UserX, Building2, Hash, Tag, Layers, FileText, BadgeInfo, AlertTriangle, WifiOff, CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { EmptyState } from '@/components/reusable';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog, SortFieldOption } from '@/components/reusable/Dialogs/SortDialog';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedReader, setSelectedReader] = useState<RFIDReader | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<'deviceName' | 'status' | 'readRate' | 'lastSeen'>('deviceName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'deviceName', 'status', 'readRate', 'tags', 'roomName', 'lastSeen'
  ]);

  // Mock data for demonstration
  const mockReaders: RFIDReader[] = [
    {
      id: '1',
      deviceId: 'RFID-001',
      deviceName: 'Main Entrance',
      status: 'ACTIVE',
      ipAddress: '192.168.1.100',
      lastSeen: '2024-01-15T10:30:00Z',
      roomId: 1,
      roomName: 'Main Hall',
      tags: 45,
      readRate: 98.5,
      components: { antenna: 'active', power: 'stable' }
    },
    {
      id: '2',
      deviceId: 'RFID-002',
      deviceName: 'Library',
      status: 'ACTIVE',
      ipAddress: '192.168.1.101',
      lastSeen: '2024-01-15T10:29:00Z',
      roomId: 2,
      roomName: 'Library',
      tags: 23,
      readRate: 95.2,
      components: { antenna: 'active', power: 'stable' }
    },
    {
      id: '3',
      deviceId: 'RFID-003',
      deviceName: 'Cafeteria',
      status: 'MAINTENANCE',
      ipAddress: '192.168.1.102',
      lastSeen: '2024-01-15T09:15:00Z',
      roomId: 3,
      roomName: 'Cafeteria',
      tags: 0,
      readRate: 0,
      components: { antenna: 'inactive', power: 'unstable' }
    }
  ];

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

  const sortFieldOptions: SortFieldOption<string>[] = [
    { value: 'deviceName', label: 'Device Name' },
    { value: 'deviceId', label: 'Device ID' },
    { value: 'status', label: 'Status' },
    { value: 'readRate', label: 'Read Rate' },
    { value: 'tags', label: 'Active Tags' },
    { value: 'roomName', label: 'Location' },
    { value: 'lastSeen', label: 'Last Seen' },
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReaders(mockReaders);
      } catch (error) {
        toast.error('Failed to load RFID readers');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtered and sorted readers
  const filteredReaders = useMemo(() => {
    let filtered = readers;

    // Apply search filter
    if (searchInput) {
      filtered = filtered.filter(reader =>
        reader.deviceName.toLowerCase().includes(searchInput.toLowerCase()) ||
        reader.deviceId.toLowerCase().includes(searchInput.toLowerCase()) ||
        reader.roomName?.toLowerCase().includes(searchInput.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reader => reader.status === statusFilter);
    }

    // Apply room filter
    if (roomFilter !== 'all') {
      filtered = filtered.filter(reader => reader.roomId?.toString() === roomFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [readers, searchInput, statusFilter, roomFilter, sortField, sortOrder]);

  // Pagination
  const paginatedReaders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredReaders.slice(start, end);
  }, [filteredReaders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReaders.length / itemsPerPage);

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

  // Configuration handlers
  const handleConfigChange = (key: keyof RFIDConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} updated successfully`);
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('RFID configuration refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh configuration');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Table columns
  const columns: TableListColumn<RFIDReader>[] = [
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
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import reader data',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center gap-2">
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
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                RFID Readers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-between">
                  <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search readers..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
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
                      <SelectTrigger className="w-full sm:w-32 lg:w-40 xl:w-40 text-gray-700">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="1">Main Hall</SelectItem>
                        <SelectItem value="2">Library</SelectItem>
                        <SelectItem value="3">Cafeteria</SelectItem>
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
          onDelete={() => { 
            if (selectedReader) {
              setReaders(prev => prev.filter(r => r.id !== selectedReader.id));
              toast.success('Reader deleted successfully');
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
          sortField={sortField}
          setSortField={field => setSortField(field as any)}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortFieldOptions={sortFieldOptions}
          onApply={() => setSortDialogOpen(false)}
          onReset={() => {
            setSortField('deviceName');
            setSortOrder('asc');
            setSortDialogOpen(false);
          }}
          title="Sort Readers"
          tooltip="Sort readers by different fields. Choose the field and order to organize your list."
        />

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          exportableColumns={readerColumns.map(col => ({ key: col.key, label: col.label }))}
          exportColumns={visibleColumns}
          setExportColumns={setVisibleColumns}
          exportFormat={null}
          setExportFormat={() => {}}
          onExport={() => {
            toast.success('Export functionality coming soon');
            setExportDialogOpen(false);
          }}
          title="Export Readers"
          tooltip="Export reader data in various formats. Choose your preferred export options."
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
          onImport={async (data) => {
            toast.success('Import functionality coming soon');
            setImportDialogOpen(false);
            return { success: 0, failed: 0, errors: [] };
          }}
          entityName="RFIDReader"
          templateUrl={undefined}
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={5}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={readers.filter(reader => selectedIds.includes(reader.id))}
          entityType="course"
          entityLabel="reader"
          availableActions={[
            { type: 'status-update', title: 'Update Status', description: 'Update status of selected readers', icon: <Settings className="w-4 h-4" /> },
            { type: 'notification', title: 'Send Notification', description: 'Send notification to administrators', icon: <Bell className="w-4 h-4" /> },
            { type: 'export', title: 'Export Data', description: 'Export selected readers data', icon: <Download className="w-4 h-4" /> },
          ]}
          exportColumns={readerColumns.map(col => ({ id: col.key, label: col.label, default: true }))}
          notificationTemplates={[]}
          stats={{
            total: readers.filter(reader => selectedIds.includes(reader.id)).length,
            active: readers.filter(reader => selectedIds.includes(reader.id) && reader.status === 'ACTIVE').length,
            inactive: readers.filter(reader => selectedIds.includes(reader.id) && reader.status !== 'ACTIVE').length
          }}
          onActionComplete={(actionType, results) => {
            toast.success(`Bulk action '${actionType}' completed.`);
            setBulkActionsDialogOpen(false);
          }}
          onCancel={() => setBulkActionsDialogOpen(false)}
          onProcessAction={async (actionType, config) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, processed: selectedIds.length };
          }}
          getItemDisplayName={item => item.deviceName}
          getItemStatus={item => item.status}
        />
      </div>
    </div>
  );
} 