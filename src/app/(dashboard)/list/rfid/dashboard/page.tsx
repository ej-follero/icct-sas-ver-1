"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataChart from "@/components/DataChart";
import { FileText, CreditCard, Wifi, WifiOff, ScanLine, ArrowRight, Info, Settings, Plus, Upload, Printer, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, ChevronDown, ChevronUp, Copy, Hash, Tag, Layers, Clock, UserCheck as UserCheckIcon, Archive, Loader2, Columns3, List, Filter } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { EmptyState } from '@/components/reusable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterChips } from '@/components/FilterChips';
import { useDebounce } from '@/hooks/use-debounce';
import { Checkbox } from "@/components/ui/checkbox";
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { TablePagination } from '@/components/reusable/Table/TablePagination';

import { rfidDashboardService, RFIDDashboardData, RFIDDashboardStats, RFIDScanLog, RFIDChartData } from "@/lib/services/rfid-dashboard.service";
import { useRFIDRealTime } from "@/hooks/useRFIDRealTime";
import { toast } from "sonner";

// Filter interfaces
interface RFIDFilters extends Record<string, string[]> {
  status: string[];
  location: string[];
  scanType: string[];
  readerId: string[];
  tagId: string[];
}

// Transform data for backward compatibility
const transformStats = (data: any) => {
  if (!data?.stats) return {
    totalTags: 0,
    activeTags: 0,
    totalReaders: 0,
    activeReaders: 0,
    totalScans: 0,
    todayScans: 0,
    weeklyScans: 0,
    monthlyScans: 0,
  };
  
  return {
    totalTags: data.stats.totalTags,
    activeTags: data.stats.activeTags,
    totalReaders: data.stats.totalReaders,
    activeReaders: data.stats.activeReaders,
    totalScans: data.stats.totalScans,
    todayScans: data.stats.todayScans,
    weeklyScans: data.stats.weeklyScans,
    monthlyScans: data.stats.monthlyScans,
  };
};

const statusBadge = (status: string) => {
  switch (status) {
    case "success":
      return <Badge variant="default">Success</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    case "unauthorized":
      return <Badge variant="destructive">Unauthorized</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function RFIDDashboardPage() {
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RFIDFilters>({
    status: [],
    location: [],
    scanType: [],
    readerId: [],
    tagId: []
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data,
    loading,
    error,
    refresh,
    setFilters: setApiFilters
  } = useRFIDRealTime({
    autoRefresh: false,
    refreshInterval: 30000,
    onError: (error) => {
      toast.error(`Failed to update RFID data: ${error}`);
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Transform data for backward compatibility
  const stats = useMemo(() => transformStats(data), [data]);
  const tagStatusData = useMemo(() => data?.tagActivityChart || [], [data]);
  const readerStatusData = useMemo(() => data?.readerStatusChart || [], [data]);
  const scanTrendsData = useMemo(() => data?.scanTrendsChart || [], [data]);
  const recentLogs = useMemo(() => data?.recentScans || [], [data]);

  // Get unique filter options from data
  const statuses = useMemo(() => [...new Set(recentLogs.map((log: any) => log.status).filter(Boolean))], [recentLogs]);
  const locations = useMemo(() => [...new Set(recentLogs.map((log: any) => log.location).filter(Boolean))], [recentLogs]);
  const scanTypes = useMemo(() => [...new Set(recentLogs.map((log: any) => log.scanType).filter(Boolean))], [recentLogs]);
  const readerIds = useMemo(() => [...new Set(recentLogs.map((log: any) => log.readerId).filter(Boolean))], [recentLogs]);
  const tagIds = useMemo(() => [...new Set(recentLogs.map((log: any) => log.tagId).filter(Boolean))], [recentLogs]);

  // Function to get count for each filter option
  const getFilterCount = useCallback((filterType: string, option: string): number => {
    return recentLogs.filter((log: any) => {
      switch (filterType) {
        case 'status':
          return log.status === option;
        case 'location':
          return log.location === option;
        case 'scanType':
          return log.scanType === option;
        case 'readerId':
          return log.readerId === option;
        case 'tagId':
          return log.tagId === option;
        default:
          return false;
      }
    }).length;
  }, [recentLogs]);

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    let filtered = recentLogs.filter((log: any) => {
      const matchesSearch = 
        (log.tagId?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false) ||
        (log.studentName?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false) ||
        (log.readerId?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false) ||
        (log.location?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false);
      
      // Apply filters
      const matchesStatus = filters.status.length === 0 || filters.status.includes(log.status);
      const matchesLocation = filters.location.length === 0 || filters.location.includes(log.location);
      const matchesScanType = filters.scanType.length === 0 || filters.scanType.includes(log.scanType);
      const matchesReaderId = filters.readerId.length === 0 || filters.readerId.includes(log.readerId);
      const matchesTagId = filters.tagId.length === 0 || filters.tagId.includes(log.tagId);
      
      return matchesSearch && matchesStatus && matchesLocation && matchesScanType && matchesReaderId && matchesTagId;
    });

    return filtered;
  }, [recentLogs, debouncedSearch, filters]);

  // Pagination
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredLogs.length / pageSize)), [filteredLogs.length, pageSize]);
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, page, pageSize]);

  // Helpers
  const getRowId = (log: any) => String(log.id || log.logsId || `${log.tagId}-${log.timestamp}`);
  const toggleSelectAll = () => {
    if (selected.size === paginatedLogs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedLogs.map((l: any) => getRowId(l))));
    }
  };
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const openLogDetails = (log: any) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  // Bulk actions
  const handleExportSelected = () => {
    const rows = filteredLogs.filter((l: any) => selected.has(getRowId(l)));
    if (rows.length === 0) return;
    const headers = ['Status','Tag ID','Student','Reader','Location','Type','Timestamp'];
    const csv = [
      headers.join(','),
      ...rows.map((r: any) => [
        r.status,
        r.tagId,
        (r.studentName || 'Unknown').toString().replace(/,/g,' '),
        r.readerId,
        r.location,
        (r.scanType || 'attendance'),
        r.timestamp
      ].map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfid-selected-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySelectedTagIds = async () => {
    const ids = filteredLogs.filter((l: any) => selected.has(getRowId(l))).map((l: any) => l.tagId).filter(Boolean);
    await navigator.clipboard.writeText(ids.join('\n'));
    toast.success('Tag IDs copied to clipboard');
  };

  const handleExportFiltered = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast.error('No records to export');
      return;
    }
    const headers = ['Status','Tag ID','Student','Reader','Location','Type','Timestamp'];
    const csv = [
      headers.join(','),
      ...filteredLogs.map((r: any) => [
        r.status,
        r.tagId,
        (r.studentName || 'Unknown').toString().replace(/,/g,' '),
        r.readerId,
        r.location,
        (r.scanType || 'attendance'),
        r.timestamp
      ].map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfid-filtered-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      location: [],
      scanType: [],
      readerId: [],
      tagId: []
    });
  };

  // Update API filters when local filters change
  useEffect(() => {
    const apiFilterParams: any = {};
    if (filters.status.length > 0) apiFilterParams.status = filters.status;
    if (filters.location.length > 0) apiFilterParams.location = filters.location;
    if (filters.scanType.length > 0) apiFilterParams.scanType = filters.scanType;
    if (filters.readerId.length > 0) apiFilterParams.readerId = filters.readerId[0]; // Single value
    if (filters.tagId.length > 0) apiFilterParams.tagId = filters.tagId[0]; // Single value
    
    setApiFilters(apiFilterParams);
  }, [filters, setApiFilters]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <PageHeader
            title="RFID Overview"
            subtitle="Loading dashboard data..."
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'RFID Management', href: '/list/rfid' },
              { label: 'Overview' }
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <PageHeader
            title="RFID Overview"
            subtitle="Error loading dashboard data"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'RFID Management', href: '/list/rfid' },
              { label: 'Overview' }
            ]}
          />
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refresh} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Header */}
        <PageHeader
          title="RFID Overview"
          subtitle="Monitor, analyze, and manage your RFID system at a glance."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'RFID Management', href: '/list/rfid' },
            { label: 'Overview' }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<CreditCard className="text-blue-500 w-5 h-5" />}
            label="Total Tags"
            value={stats.totalTags}
            valueClassName="text-blue-900"
            sublabel="Total RFID tags in system"
          />
          <SummaryCard
            icon={<Wifi className="text-green-500 w-5 h-5" />}
            label="Active Readers"
            value={stats.activeReaders}
            valueClassName="text-green-900"
            sublabel="Currently active"
          />
          <SummaryCard
            icon={<ScanLine className="text-blue-500 w-5 h-5" />}
            label="Today's Scans"
            value={stats.todayScans}
            valueClassName="text-blue-900"
            sublabel="Scans recorded today"
          />
          <SummaryCard
            icon={<FileText className="text-purple-500 w-5 h-5" />}
            label="Total Scans"
            value={stats.totalScans}
            valueClassName="text-purple-900"
            sublabel="All-time scan records"
          />
        </div>

        

        {/* Advanced Filters removed */}

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential RFID management tools"
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
                description: 'Register new RFID tag',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => window.location.href = '/list/rfid/tags'
              },
              {
                id: 'configure-reader',
                label: 'Configure Reader',
                description: 'Setup RFID reader',
                icon: <Settings className="w-5 h-5 text-white" />,
                onClick: () => window.location.href = '/list/rfid/readers'
              },
              {
                id: 'view-logs',
                label: 'View Logs',
                description: 'Check RFID activity logs',
                icon: <FileText className="w-5 h-5 text-white" />,
                onClick: () => window.location.href = '/list/rfid/logs'
              },
              {
                id: 'export-data',
                label: 'Export Data',
                description: 'Export RFID data',
                icon: <Download className="w-5 h-5 text-white" />,
                onClick: handleExportFiltered
              },
              {
                id: 'print-report',
                label: 'Print Report',
                description: 'Generate RFID report',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => console.log('Print RFID report')
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload RFID data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-white" />
                ),
                onClick: handleRefresh,
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

        {/* Charts Section with Enhanced UI/UX */}
        <div className="w-full max-w-full pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header - flush to card edge, no rounded corners */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                          <path d="M3 3v18h18"/>
                          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">RFID Analytics & Charts</h3>
                        <p className="text-blue-100 text-sm">Visual insights and data trends</p>
                      </div>
                    </div>
                    <div className="pr-2 sm:pr-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        aria-label="Refresh charts"
                        className="border-white/60 text-white hover:bg-white/10 hover:text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            {/* Charts Content */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/70 rounded p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-gray-900">Tag Status Distribution</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about tag status distribution" />
                        </TooltipTrigger>
                        <TooltipContent>Breakdown of all RFID tag statuses</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Breakdown of all RFID tag statuses</p>
                  <div style={{ height: 300 }} className="flex items-center justify-center">
                    <DataChart
                      type="pie"
                      data={tagStatusData}
                      title="Tag Status"
                      height={250}
                    />
                  </div>
                </div>
                
                <div className="bg-white/70 rounded p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-gray-900">Reader Status</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-green-500 cursor-pointer" aria-label="Info about reader status" />
                        </TooltipTrigger>
                        <TooltipContent>Online vs Offline readers</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Online vs Offline readers</p>
                  <div style={{ height: 300 }} className="flex items-center justify-center">
                    <DataChart
                      type="pie"
                      data={readerStatusData}
                      title="Reader Status"
                      height={250}
                      colors={["#22c55e", "#ef4444"]}
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2 bg-white/70 rounded p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-gray-900">Scan Trends (This Week)</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about scan trends" />
                        </TooltipTrigger>
                        <TooltipContent>RFID scans per day</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">RFID scans per day</p>
                  <div style={{ height: 300 }} className="flex items-center justify-center">
                    <DataChart
                      type="bar"
                      data={scanTrendsData}
                      title="Scan Trends"
                      height={250}
                      colors={["#3b82f6"]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity with Enhanced UI/UX from Course List */}
        <div className="w-full max-w-full pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header - flush to card edge, no rounded corners */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Recent RFID Activity</h3>
                      <p className="text-blue-100 text-sm">Latest scans and events</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            {/* Search & Filters */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row gap-3 items-center lg:justify-end lg:ml-auto">
                {/* Search Bar */}
                <div className="relative w-full lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tag, student, reader, location..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>

                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end">
                  {/* Status */}
                  <Select value={filters.status[0] || 'all'} onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters({ ...filters, status: [] });
                    } else {
                      setFilters({ ...filters, status: [value] });
                    }
                  }}>
                    <SelectTrigger className="w-full lg:w-40 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statuses.map((s: string) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Location */}
                  <Select value={filters.location[0] || 'all'} onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters({ ...filters, location: [] });
                    } else {
                      setFilters({ ...filters, location: [value] });
                    }
                  }}>
                    <SelectTrigger className="w-full lg:w-40 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((l: string) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Scan Type */}
                  <Select value={filters.scanType[0] || 'all'} onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters({ ...filters, scanType: [] });
                    } else {
                      setFilters({ ...filters, scanType: [value] });
                    }
                  }}>
                    <SelectTrigger className="w-full lg:w-36 text-sm text-gray-500 min-w-0 rounded border-gray-300 bg-white hover:bg-gray-50">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {scanTypes.map((t: string) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {Object.values(filters).some(arr => arr.length > 0) && (
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <FilterChips
                    filters={filters}
                    fields={[
                      { key: 'status', label: 'Status', allowIndividualRemoval: true },
                      { key: 'location', label: 'Location', allowIndividualRemoval: true },
                      { key: 'scanType', label: 'Type', allowIndividualRemoval: true },
                      { key: 'readerId', label: 'Reader', allowIndividualRemoval: true },
                      { key: 'tagId', label: 'Tag', allowIndividualRemoval: true }
                    ]}
                    onRemove={(key, value) => {
                      if (value) {
                        const current = (filters as any)[key] as string[];
                        const next = current.filter(v => v !== value);
                        setFilters({ ...filters, [key]: next } as any);
                      } else {
                        setFilters({ ...filters, [key]: [] } as any);
                      }
                    }}
                    onClearAll={handleClearFilters}
                    searchQuery={searchQuery}
                    onRemoveSearch={() => setSearchQuery('')}
                    showSearchChip={true}
                  />
                </div>
              )}
            </div>
            {/* Real-time status controls removed */}
            {/* Table Content */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {/* Bulk Actions Bar */}
                {selected.size > 0 && (
                  <div className="px-3 pt-3">
                    <BulkActionsBar
                      selectedCount={selected.size}
                      onClear={() => setSelected(new Set())}
                      entityLabel="log"
                      actions={[
                        { key: 'export', label: 'Export Selected', icon: <Download className="w-4 h-4 mr-2" />, onClick: handleExportSelected },
                        { key: 'copy', label: 'Copy Tag IDs', icon: <Copy className="w-4 h-4 mr-2" />, onClick: handleCopySelectedTagIds },
                        { key: 'clear', label: 'Clear Selection', icon: <X className="w-4 h-4 mr-2" />, onClick: () => setSelected(new Set()) }
                      ]}
                    />
                  </div>
                )}
                {/* Loader overlay when refreshing */}
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {!isRefreshing && filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<FileText className="w-6 h-6 text-blue-400" />}
                        title="No RFID activity found"
                        description="Try adjusting your search criteria or filters to find the RFID logs you're looking for."
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
                    <Table className="border-0 shadow-none max-w-full">
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="w-8 text-center">
                            <Checkbox
                              checked={selected.size === paginatedLogs.length && paginatedLogs.length > 0}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Select all"
                            />
                          </TableHead>
                          <TableHead className="w-8 text-center">{''}</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Status</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Tag ID</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Student</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Reader</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Location</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Type</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Timestamp</TableHead>
                          <TableHead className="text-blue-900 font-semibold text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[&>tr>td]:text-blue-900">
                        {paginatedLogs.map((log: any) => {
                          const id = getRowId(log);
                          const isExpanded = expanded.has(id);
                          return (
                            <Fragment key={id}>
                              <TableRow className="hover:bg-muted/50 border-b">
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={selected.has(id)}
                                    onCheckedChange={() => toggleSelect(id)}
                                    aria-label="Select row"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <button onClick={() => toggleExpand(id)} aria-label="Toggle details" className="p-1 text-blue-700">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </TableCell>
                                <TableCell className="text-center">{statusBadge(log.status)}</TableCell>
                                <TableCell className="font-medium text-center">{log.tagId}</TableCell>
                                <TableCell className="text-center">{log.studentName || 'Unknown'}</TableCell>
                                <TableCell className="text-center">{log.readerId}</TableCell>
                                <TableCell className="text-center">{log.location}</TableCell>
                                <TableCell className="capitalize text-center">{log.scanType || 'attendance'}</TableCell>
                                <TableCell className="text-center">{log.timestamp}</TableCell>
                                <TableCell className="text-center">
                                  <Button variant="ghost" size="sm" onClick={() => openLogDetails(log)} aria-label="View details" className="hover:rounded transition-[border-radius] duration-200">
                                    <Eye className="w-4 h-4 text-blue-700" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow className="bg-white/60">
                                  <TableCell colSpan={10} className="py-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-blue-900">
                                      <div className="bg-blue-50/50 border border-blue-200 rounded p-3">
                                        <div className="font-semibold mb-1">Scan Details</div>
                                        <div>Tag ID: {log.tagId}</div>
                                        <div>Type: {log.scanType || 'attendance'}</div>
                                        <div>Status: {log.status}</div>
                                      </div>
                                      <div className="bg-blue-50/50 border border-blue-200 rounded p-3">
                                        <div className="font-semibold mb-1">Reader</div>
                                        <div>ID: {log.readerId}</div>
                                        <div>Location: {log.location}</div>
                                      </div>
                                      <div className="bg-blue-50/50 border border-blue-200 rounded p-3">
                                        <div className="font-semibold mb-1">Subject</div>
                                        <div>Student: {log.studentName || 'Unknown'}</div>
                                        <div>Timestamp: {log.timestamp}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
            {/* Pagination (matching Instructors page) */}
            <div className="px-3 sm:px-4 lg:px-6 py-3">
              <TablePagination
                page={page}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={(newPage: number) => setPage(newPage)}
                onPageSizeChange={(newSize: number) => { setPageSize(newSize); setPage(1); }}
                pageSizeOptions={[5,10,20,50]}
              />
            </div>
          </Card>
        </div>

        <ViewDialog
          open={showLogDetails}
          onOpenChange={setShowLogDetails}
          title="RFID Scan Details"
          subtitle="Full information for the selected scan"
          sections={selectedLog ? ([
            {
              title: 'Scan',
              columns: 2,
              fields: [
                { label: 'Tag ID', value: selectedLog.tagId },
                { label: 'Type', value: selectedLog.scanType || 'attendance' },
                { label: 'Status', value: selectedLog.status, type: 'badge', badgeVariant: 'default' },
                { label: 'Timestamp', value: selectedLog.timestamp, type: 'date' }
              ]
            },
            {
              title: 'Reader',
              columns: 2,
              fields: [
                { label: 'Reader ID', value: selectedLog.readerId },
                { label: 'Location', value: selectedLog.location || 'Unknown' }
              ]
            },
            {
              title: 'Subject',
              columns: 2,
              fields: [
                { label: 'Student', value: selectedLog.studentName || 'Unknown' }
              ]
            }
          ]) : []}
          showCopyButton={true}
          showPrintButton={true}
          showExportButton={true}
        />
      </div>
    </div>
  );
}
