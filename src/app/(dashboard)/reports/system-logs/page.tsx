"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Database,
  Shield,
  Download,
  Search,
  Filter,
  Plus,
  Archive,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  X,
  Loader2,
  Printer,
  Upload,
  List,
  Columns3,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Pencil,
  BookOpen,
  GraduationCap,
  BadgeInfo,
  ChevronRight,
  Hash,
  Tag,
  Layers,
  Info,
  Building2,
  Bell,
  Settings,
  Mail
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import ReportGenerator from "@/components/ReportGenerator";
import { EmptyState } from "@/components/reusable";
import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from '@/components/SummaryCard';
import { SummaryCardSkeleton, PageSkeleton } from '@/components/reusable/Skeleton';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ImportDialog } from '@/components/reusable/Dialogs/ImportDialog';
import { PrintLayout } from '@/components/PrintLayout';
import { useDebounce } from '@/hooks/use-debounce';
import Fuse from "fuse.js";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  module: string;
  action: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  details: string;
}

type SortField = 'timestamp' | 'level' | 'module' | 'action' | 'userEmail' | 'ipAddress';
type SortOrder = 'asc' | 'desc';

const systemLogSortFieldOptions: { value: string; label: string }[] = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'level', label: 'Level' },
  { value: 'module', label: 'Module' },
  { value: 'action', label: 'Action' },
  { value: 'userEmail', label: 'User Email' },
  { value: 'ipAddress', label: 'IP Address' },
];

const mockSystemLogs: SystemLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    level: 'INFO',
    module: 'Authentication',
    action: 'User Login',
    userId: 'admin-001',
    userEmail: 'admin@icct.edu',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    details: 'Successful login from admin panel'
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    level: 'WARNING',
    module: 'RFID System',
    action: 'Reader Offline',
    userId: 'system',
    userEmail: 'system@icct.edu',
    ipAddress: '192.168.1.50',
    userAgent: 'RFID-Reader-1.0',
    details: 'RFID reader in Room 101 went offline'
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    level: 'ERROR',
    module: 'Database',
    action: 'Connection Failed',
    userId: 'system',
    userEmail: 'system@icct.edu',
    ipAddress: '192.168.1.1',
    userAgent: 'Database-Service',
    details: 'Database connection timeout after 30 seconds'
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:15:00Z',
    level: 'INFO',
    module: 'Attendance',
    action: 'Record Created',
    userId: 'teacher-001',
    userEmail: 'teacher@icct.edu',
    ipAddress: '192.168.1.75',
    userAgent: 'Attendance-App-1.0',
    details: 'New attendance record created for student ID 12345'
  },
  {
    id: '5',
    timestamp: '2024-01-15T10:10:00Z',
    level: 'DEBUG',
    module: 'API',
    action: 'Request Processed',
    userId: 'api-user',
    userEmail: 'api@icct.edu',
    ipAddress: '192.168.1.25',
    userAgent: 'API-Client-2.0',
    details: 'API request processed successfully'
  }
];

const getLogLevelColor = (level: string) => {
  switch (level) {
    case 'ERROR':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'INFO':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'DEBUG':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getLogLevelIcon = (level: string) => {
  switch (level) {
    case 'ERROR':
      return <AlertTriangle className="w-4 h-4" />;
    case 'WARNING':
      return <AlertTriangle className="w-4 h-4" />;
    case 'INFO':
      return <CheckCircle className="w-4 h-4" />;
    case 'DEBUG':
      return <Activity className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

export default function SystemLogsPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['timestamp', 'level', 'module', 'action', 'userEmail', 'ipAddress']);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Add Fuse.js setup for fuzzy search
  const fuse = useMemo(() => new Fuse(mockSystemLogs, {
    keys: ["module", "action", "userEmail", "details"],
    threshold: 0.4,
    includeMatches: true,
  }), [mockSystemLogs]);

  const fuzzyResults = useMemo(() => {
    if (!searchValue) return mockSystemLogs.map((l, i: number) => ({ item: l, refIndex: i }));
    return fuse.search(searchValue);
  }, [searchValue, fuse, mockSystemLogs]);

  // Enhanced filtering logic
  const filteredLogs = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(item => item.level === selectedLevel);
    }

    // Apply module filter
    if (selectedModule !== 'all') {
      filtered = filtered.filter(item => item.module === selectedModule);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const modifier = sortOrder === "asc" ? 1 : -1;
      if (sortField === "timestamp") {
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * modifier;
      }
      return (a[sortField] > b[sortField] ? 1 : -1) * modifier;
    });

    return filtered;
  }, [fuzzyResults, selectedLevel, selectedModule, sortField, sortOrder]);

  // Pagination
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Selection logic
  const isAllSelected = paginatedLogs.length > 0 && paginatedLogs.every(l => selectedItems.includes(l.id));
  const isIndeterminate = selectedItems.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedLogs.map(l => l.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only activate shortcuts if we're on a page with search functionality
      const hasSearchInput = document.querySelector('input[placeholder*="Search"]');
      if (!hasSearchInput) return;
      
      // Ctrl/Cmd + K for search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Ctrl/Cmd + R for refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }
      // Escape to clear search
      if (event.key === 'Escape') {
        setSearchValue('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleBulkAction = (action: 'archive' | 'delete') => {
    if (selectedItems.length === 0) return;
    
    setIsLoading(true);
    // Simulate bulk action
    setTimeout(() => {
      setSelectedItems([]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  const modules = [...new Set(mockSystemLogs.map(log => log.module))];
  const levels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];

  const stats = {
    total: mockSystemLogs.length,
    info: mockSystemLogs.filter(l => l.level === 'INFO').length,
    warning: mockSystemLogs.filter(l => l.level === 'WARNING').length,
    error: mockSystemLogs.filter(l => l.level === 'ERROR').length,
    debug: mockSystemLogs.filter(l => l.level === 'DEBUG').length,
    today: mockSystemLogs.filter(l => l.timestamp.startsWith('2024-01-15')).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <PageHeader
            title="System Logs"
            subtitle="Monitor system activity and troubleshoot issues"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Reports", href: "/reports" },
              { label: "System Logs" }
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="System Logs"
          subtitle="Monitor system activity and troubleshoot issues"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Reports", href: "/reports" },
            { label: "System Logs" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<FileText className="text-blue-500 w-5 h-5" />}
            label="Total Logs"
            value={stats.total}
            valueClassName="text-blue-900"
            sublabel="All system logs"
          />
          <SummaryCard
            icon={<CheckCircle className="text-green-500 w-5 h-5" />}
            label="Info"
            value={stats.info}
            valueClassName="text-green-900"
            sublabel="Information logs"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-yellow-500 w-5 h-5" />}
            label="Warnings"
            value={stats.warning}
            valueClassName="text-yellow-900"
            sublabel="Warning logs"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-red-500 w-5 h-5" />}
            label="Errors"
            value={stats.error}
            valueClassName="text-red-900"
            sublabel="Error logs"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential system log tools"
            icon={
              <div className="w-6 h-6 text-white">
                <Activity className="w-6 h-6" />
              </div>
            }
            actionCards={[
              {
                id: 'export-logs',
                label: 'Export Logs',
                description: 'Export system logs',
                icon: <Download className="w-5 h-5 text-white" />,
                onClick: () => setExportDialogOpen(true)
              },
              {
                id: 'import-logs',
                label: 'Import Data',
                description: 'Import logs from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-logs',
                label: 'Print Page',
                description: 'Print log list',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle print */ }
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
                  <RefreshCw className="w-5 h-5 text-white" />
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
              {/* Blue Gradient Header */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">System Logs</h3>
                      <p className="text-blue-100 text-sm">Search and filter system activity logs</p>
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
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value)}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {levels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedModule} onValueChange={(value) => setSelectedModule(value)}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {modules.map(module => (
                        <SelectItem key={module} value={module}>{module}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedItems.length > 0 && (
              <div className="mt-2 sm:mt-3 px-2 sm:px-3 lg:px-6 max-w-full">
                <BulkActionsBar
                  selectedCount={selectedItems.length}
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
                      key: "archive",
                      label: "Archive Selected",
                      icon: <Archive className="w-4 h-4 mr-2" />,
                      onClick: () => handleBulkAction('archive'),
                      tooltip: "Archive selected logs",
                      variant: "outline"
                    },
                    {
                      key: "delete",
                      label: "Delete Selected",
                      icon: <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: () => handleBulkAction('delete'),
                      tooltip: "Delete selected logs",
                      variant: "destructive"
                    }
                  ]}
                  onClear={() => setSelectedItems([])}
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
                  {!isLoading && filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<Activity className="w-6 h-6 text-blue-400" />}
                        title="No system logs found"
                        description="Try adjusting your search criteria or filters to find the logs you're looking for."
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
                    <div className="space-y-3">
                      {paginatedLogs.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                            aria-label={`Select ${item.action}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{item.action}</h4>
                              <Badge className={`text-xs ${getLogLevelColor(item.level)}`}>
                                {item.level}
                              </Badge>
                              <Badge className="text-xs bg-blue-100 text-blue-700">
                                {item.module}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.details}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{new Date(item.timestamp).toLocaleString()}</span>
                              <span>{item.userEmail}</span>
                              <span>{item.ipAddress}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View log"
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
                        </div>
                      ))}
                    </div>
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
        <ViewDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedLog ? `${selectedLog.action}` : "System Log Details"}
          subtitle={selectedLog?.module}
          status={selectedLog ? {
            value: selectedLog.level,
            variant: selectedLog.level === "ERROR" ? "destructive" : 
                    selectedLog.level === "WARNING" ? "default" : "secondary"
          } : undefined}
          headerVariant="default"
          sections={selectedLog ? ([
            {
              title: "Log Information",
              fields: [
                { label: 'ID', value: selectedLog.id, icon: <Hash className="w-4 h-4 text-blue-600" /> },
                { label: 'Action', value: selectedLog.action, icon: <Activity className="w-4 h-4 text-blue-600" /> },
                { label: 'Module', value: selectedLog.module, icon: <Tag className="w-4 h-4 text-blue-600" /> },
                { label: 'Level', value: selectedLog.level, icon: <Layers className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "User Information",
              fields: [
                { label: 'User ID', value: selectedLog.userId, icon: <User className="w-4 h-4 text-blue-600" /> },
                { label: 'User Email', value: selectedLog.userEmail, icon: <Mail className="w-4 h-4 text-blue-600" /> },
                { label: 'IP Address', value: selectedLog.ipAddress, icon: <Database className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Timestamps",
              fields: [
                { label: 'Timestamp', value: selectedLog.timestamp, type: 'date', icon: <Clock className="w-4 h-4 text-blue-600" /> },
              ]
            },
            selectedLog.details ? {
              title: "Details",
              fields: [
                { label: 'Details', value: selectedLog.details, icon: <FileText className="w-4 h-4 text-blue-600" /> },
              ]
            } : undefined
          ].filter(Boolean) as import('@/components/reusable/Dialogs/ViewDialog').ViewDialogSection[]) : []}
          description={selectedLog?.module ? `Module: ${selectedLog.module}` : undefined}
          tooltipText="View detailed system log information"
        />

        <ConfirmDeleteDialog
          open={deleteModalOpen}
          onOpenChange={(open) => {
            setDeleteModalOpen(open);
            if (!open) setSelectedLog(null);
          }}
          itemName={selectedLog?.action}
          onDelete={() => { if (selectedLog) handleBulkAction('delete'); }}
          onCancel={() => { setDeleteModalOpen(false); setSelectedLog(null); }}
          canDelete={true}
          deleteError={undefined}
          description={selectedLog ? `Are you sure you want to delete the log "${selectedLog.action}"? This action cannot be undone.` : undefined}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={paginatedLogs.filter(item => selectedItems.includes(item.id))}
          entityType="systemLog"
          entityLabel="log"
          availableActions={[
            { 
              id: 'status-update', 
              label: 'Update Status', 
              description: 'Update status of selected logs', 
              icon: <Settings className="w-4 h-4" />,
              tabId: 'status-update'
            },
            { 
              id: 'notification', 
              label: 'Send Notification', 
              description: 'Send notification to administrators', 
              icon: <Bell className="w-4 h-4" />,
              tabId: 'notification'
            },
            { 
              id: 'export', 
              label: 'Export Data', 
              description: 'Export selected logs data', 
              icon: <Download className="w-4 h-4" />,
              tabId: 'export'
            },
          ]}
          onActionComplete={(actionType: string, results: any) => {
            toast.success(`Bulk action '${actionType}' completed.`);
            setBulkActionsDialogOpen(false);
            setSelectedItems([]);
          }}
          onCancel={() => {
            setBulkActionsDialogOpen(false);
          }}
          onProcessAction={async (actionType: string, config: any) => {
            // Simulate bulk action processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, processed: selectedItems.length };
          }}
          getItemDisplayName={item => item.action}
          getItemStatus={item => item.level}
          getItemId={item => item.id}
        />
      </div>
    </div>
  );
} 