"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Archive,
  Clock,
  User,
  MessageCircle,
  Mail,
  Bell,
  Megaphone,
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
  Settings,
  Plus,
  Upload
} from "lucide-react";
import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { toast } from "sonner";

interface CommunicationLog {
  id: string;
  type: 'message' | 'email' | 'announcement' | 'notification';
  title: string;
  sender: string;
  recipient: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  content: string;
  readCount?: number;
  totalRecipients?: number;
  deliveryTime?: number;
  errorMessage?: string;
}

// Real communication logs will be fetched from API

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'delivered':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'read':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500 text-white border-red-600';
    case 'high':
      return 'bg-orange-500 text-white border-orange-600';
    case 'normal':
      return 'bg-blue-500 text-white border-blue-600';
    case 'low':
      return 'bg-gray-500 text-white border-gray-600';
    default:
      return 'bg-gray-500 text-white border-gray-600';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageCircle className="w-4 h-4" />;
    case 'email':
      return <Mail className="w-4 h-4" />;
    case 'announcement':
      return <Megaphone className="w-4 h-4" />;
    case 'notification':
      return <Bell className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

export default function CommunicationLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState({
    totalLogs: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    successRate: '0.0',
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch communication logs from API
  const fetchCommunicationLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sortBy: 'timestamp',
        sortOrder: 'desc',
        search: searchQuery,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterPriority !== 'all' && { priority: filterPriority.toUpperCase() }),
        ...(filterType !== 'all' && { type: filterType }),
      });

      const response = await fetch(`/api/communications/logs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch communication logs');
      }

      const data = await response.json();
      setCommunicationLogs(data.items || []);
      setTotalLogs(data.total || 0);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching communication logs:', error);
      toast.error('Failed to fetch communication logs. Please try again.');
      setCommunicationLogs([]);
      setTotalLogs(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCommunicationLogs();
  }, [currentPage, itemsPerPage, searchQuery, filterStatus, filterType, filterPriority]);

  // Filter logs based on search and filters (client-side filtering for additional refinement)
  const filteredLogs = useMemo(() => {
    let filtered = communicationLogs;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    // Apply priority filter (API already handles this, but keep for client-side refinement)
    if (filterPriority !== 'all') {
      filtered = filtered.filter(log => log.priority.toLowerCase() === filterPriority.toLowerCase());
    }

    return filtered;
  }, [searchQuery, filterStatus, filterType, filterPriority]);

  // Pagination
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Selection logic
  const isAllSelected = paginatedLogs.length > 0 && paginatedLogs.every(log => selectedItems.includes(log.id));
  const isIndeterminate = selectedItems.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedLogs.map(log => log.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchCommunicationLogs();
      toast.success("Logs refreshed successfully!");
    } catch (error) {
      console.error('Error refreshing logs:', error);
      toast.error('Failed to refresh logs');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const logsToExport = selectedItems.length > 0 ? selectedItems : communicationLogs.map(log => log.id);
      
      if (logsToExport.length === 0) {
        toast.error('No logs to export');
        return;
      }

      const response = await fetch('/api/communications/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          logIds: logsToExport,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.exportData || !Array.isArray(data.exportData)) {
        throw new Error('Invalid export data received from server');
      }
      
      // Create CSV content
      const csvContent = [
        'ID,Type,Title,Sender,Recipient,Timestamp,Status,Priority,Content,Delivery Time,Error Message',
        ...data.exportData.map((log: any) => [
          log.id || '',
          log.type || '',
          `"${(log.title || '').replace(/"/g, '""')}"`,
          `"${(log.sender || '').replace(/"/g, '""')}"`,
          `"${(log.recipient || '').replace(/"/g, '""')}"`,
          log.timestamp || '',
          log.status || '',
          log.priority || '',
          `"${(log.content || '').replace(/"/g, '""')}"`,
          log.deliveryTime || '',
          log.errorMessage || ''
        ].join(','))
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `communication-logs-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${data.exportData.length} communication logs`);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to export logs: ${errorMessage}`);
    }
  };

  const handleArchiveLogs = async () => {
    try {
      const response = await fetch('/api/communications/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'archive',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive logs');
      }

      const data = await response.json();
      toast.success(`Archived ${data.archivedEmails + data.archivedAnnouncements} old logs`);
      fetchCommunicationLogs(); // Refresh the data
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive logs');
    }
  };

  const handlePrintLogs = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = `
        <html>
          <head>
            <title>Communication Logs Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { margin-bottom: 20px; }
              .date { font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Communication Logs Report</h1>
              <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
              <p>Total Logs: ${stats.totalLogs}</p>
              <p>Success Rate: ${stats.successRate}%</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Sender</th>
                  <th>Recipient</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                ${communicationLogs.map(log => `
                  <tr>
                    <td>${log.type}</td>
                    <td>${log.title}</td>
                    <td>${log.sender}</td>
                    <td>${log.recipient}</td>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.status}</td>
                    <td>${log.priority}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDeleteLog = async () => {
    if (!selectedLog) return;
    
    setIsDeleting(true);
    try {
      // Determine if it's an email or announcement based on the ID
      const isEmail = selectedLog.id.startsWith('email-');
      const entityId = selectedLog.id.replace(/^(email-|announcement-)/, '');
      
      if (isEmail) {
        // Soft delete email by moving to trash
        await fetch(`/api/emails/${entityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'TRASH' })
        });
      } else {
        // Soft delete announcement by setting to inactive
        await fetch(`/api/announcements/${entityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'INACTIVE' })
        });
      }
      
      toast.success('Log deleted successfully');
      setDeleteModalOpen(false);
      setSelectedLog(null);
      
      // Refresh the logs
      await fetchCommunicationLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    setIsDeleting(true);
    try {
      const deletePromises = selectedItems.map(async (logId) => {
        const isEmail = logId.startsWith('email-');
        const entityId = logId.replace(/^(email-|announcement-)/, '');
        
        if (isEmail) {
          return fetch(`/api/emails/${entityId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'TRASH' })
          });
        } else {
          return fetch(`/api/announcements/${entityId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'INACTIVE' })
          });
        }
      });
      
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedItems.length} logs`);
      setSelectedItems([]);
      
      // Refresh the logs
      await fetchCommunicationLogs();
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast.error('Failed to delete logs. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats are now managed in state and fetched from API

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Communication Logs"
          subtitle="View and manage all communication activity logs"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Communication", href: "/list/communication" },
            { label: "Logs" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<FileText className="text-blue-500 w-5 h-5" />}
            label="Total Logs"
            value={stats.totalLogs}
            valueClassName="text-blue-900"
            sublabel="All communication logs"
          />
          <SummaryCard
            icon={<CheckCircle className="text-blue-500 w-5 h-5" />}
            label="Success Rate"
            value={`${stats.successRate}%`}
            valueClassName="text-blue-900"
            sublabel="Successfully delivered"
          />
          <SummaryCard
            icon={<Activity className="text-blue-500 w-5 h-5" />}
            label="Read"
            value={stats.read}
            valueClassName="text-blue-900"
            sublabel="Communications read"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-blue-500 w-5 h-5" />}
            label="Failed"
            value={stats.failed}
            valueClassName="text-blue-900"
            sublabel="Failed deliveries"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential log management tools"
            icon={
              <div className="w-6 h-6 text-white">
                <FileText className="w-6 h-6" />
              </div>
            }
            actionCards={[
              {
                id: 'export-logs',
                label: 'Export Logs',
                description: 'Export communication logs',
                icon: <Download className="w-5 h-5 text-white" />,
                onClick: () => handleExportLogs()
              },
              {
                id: 'print-logs',
                label: 'Print Logs',
                description: 'Print log reports',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => handlePrintLogs()
              },
              {
                id: 'archive-logs',
                label: 'Archive Logs',
                description: 'Archive old logs',
                icon: <Archive className="w-5 h-5 text-white" />,
                onClick: () => handleArchiveLogs()
              },
              {
                id: 'delete-selected',
                label: 'Delete Selected',
                description: 'Delete selected logs',
                icon: <Trash2 className="w-5 h-5 text-white" />,
                onClick: () => handleBulkDelete(),
                disabled: selectedItems.length === 0 || isDeleting,
                loading: isDeleting
              },
              {
                id: 'refresh-logs',
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
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Communication Logs</h3>
                      <p className="text-blue-100 text-sm">Search and filter communication activity logs</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 bg-gray-50/50 p-4">
              <div className="flex items-center justify-between">
                {/* Select All Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) {
                        const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                        if (input) input.indeterminate = isIndeterminate;
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all logs"
                    className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Select All ({paginatedLogs.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative w-160">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                  />
                </div>
                
                {/* Filter Dropdowns */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-28 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-28 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {/* Loader overlay when refreshing or loading */}
                {(isRefreshing || isLoading) && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {!isLoading && filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<FileText className="w-6 h-6 text-blue-400" />}
                        title="No communication logs found"
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
                    <div className="space-y-2">
                      {paginatedLogs.map((log) => (
                        <div
                          key={log.id}
                          className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-4 left-4 z-10">
                            <Checkbox
                              checked={selectedItems.includes(log.id)}
                              onCheckedChange={() => handleSelectItem(log.id)}
                              aria-label={`Select ${log.title}`}
                              className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                          </div>

                          {/* Main Content */}
                          <div className="ml-12 flex items-start gap-4">
                            {/* Content Area */}
                            <div className="flex-1 min-w-0">
                              {/* Header Row */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-blue-600 truncate">
                                      {log.title}
                                    </h4>
                                    <Badge className={`text-xs font-medium px-2 py-1 ${getPriorityColor(log.priority)} hover:${getPriorityColor(log.priority)}`}>
                                      {log.priority.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                    {log.content}
                                  </p>
                                </div>
                                
                                {/* Status Badge */}
                                <div className="flex-shrink-0 ml-4">
                                  <Badge className={`text-xs font-medium px-3 py-1 ${getStatusColor(log.status)} hover:${getStatusColor(log.status)}`}>
                                    {log.status.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>

                              {/* Metadata Row */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-4">
                                  {/* Sender Info */}
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-700">{log.sender}</span>
                                  </div>
                                  
                                  {/* Arrow */}
                                  <span className="text-gray-400">→</span>
                                  
                                  {/* Recipient Info */}
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-700">{log.recipient}</span>
                                  </div>
                                </div>

                                {/* Timestamp */}
                                <div className="flex items-center gap-1 text-gray-500">
                                  <span>{new Date(log.timestamp).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                              </div>

                              {/* Additional Info Row */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  {/* Type Badge */}
                                  <div className="flex items-center gap-1">
                                    <span className="capitalize">{log.type}</span>
                                  </div>
                                  
                                  {/* Delivery Time (if available) */}
                                  {log.deliveryTime && (
                                    <div className="flex items-center gap-1">
                                      <span>Delivery: {log.deliveryTime}s</span>
                                    </div>
                                  )}
                                  
                                  {/* Error Message (if available) */}
                                  {log.errorMessage && (
                                    <div className="flex items-center gap-1">
                                      <span>Error: {log.errorMessage}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex-shrink-0 flex items-center gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label="View log details"
                                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                        View details
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          aria-label="Delete log"
                                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedLog(log);
                                            setDeleteModalOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                        Delete log
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Hover Effect Border */}
                          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 transition-colors pointer-events-none"></div>
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
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setSelectedLog(null);
        }}
        itemName={selectedLog?.title}
        onDelete={handleDeleteLog}
        onCancel={() => { setDeleteModalOpen(false); setSelectedLog(null); }}
        canDelete={!isDeleting}
        deleteError={undefined}
        description={selectedLog ? `Are you sure you want to delete the log "${selectedLog.title}"? This action cannot be undone.` : undefined}
      />
    </div>
  );
} 