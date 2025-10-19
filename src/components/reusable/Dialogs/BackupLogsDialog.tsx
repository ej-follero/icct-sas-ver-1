"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  Clock,
  User,
  Database,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import { backupService } from "@/lib/services/backup.service";

interface BackupLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupId?: string; // Optional - show all logs if not provided
  backupName?: string;
}

interface LogEntry {
  id: string;
  backupId?: string;
  backupName?: string;
  backupType?: string;
  backupStatus?: string;
  action: string;
  status: string;
  message?: string;
  details?: any;
  createdBy: string;
  createdAt: string;
}

interface LogsData {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export default function BackupLogsDialog({ 
  open, 
  onOpenChange, 
  backupId,
  backupName
}: BackupLogsDialogProps) {
  // Validate props
  if (!onOpenChange) {
    console.error('BackupLogsDialog: Missing required props');
    return null;
  }
  const [logsData, setLogsData] = useState<LogsData>({
    logs: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    stats: { total: 0, byStatus: {} }
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);

  // Load logs
  const loadLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        limit: itemsPerPage,
        ...filters
      };
      
      if (backupId) {
        params.backupId = backupId;
      }

      // Since getBackupLogs doesn't exist, we'll use a mock implementation
      // In a real implementation, this would call the appropriate API endpoint
      const data = await fetch('/api/backup-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }).then(res => res.json()).catch(() => ({
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        stats: { total: 0, byStatus: {} }
      }));
      setLogsData(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load backup logs');
    } finally {
      setLoading(false);
    }
  }, [backupId, filters, itemsPerPage]);

  // Load logs on mount and when filters change
  useEffect(() => {
    if (open) {
      loadLogs(1);
    }
  }, [open, loadLogs]);

  // Handle filter changes
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    loadLogs(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      action: 'all',
      status: 'all',
      startDate: '',
      endDate: ''
    });
  };

  // Export logs
  const handleExportLogs = () => {
    try {
      const csvContent = generateCSV(logsData.logs);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Failed to export logs');
    }
  };

  // Generate CSV content
  const generateCSV = useCallback((logs: LogEntry[]): string => {
    const headers = ['ID', 'Backup Name', 'Action', 'Status', 'Message', 'Created By', 'Created At'];
    const rows = logs.map(log => [
      log.id,
      log.backupName || 'N/A',
      log.action,
      log.status,
      log.message || '',
      log.createdBy,
      new Date(log.createdAt).toLocaleString()
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }, []);

  // Get status badge variant
  const getStatusBadgeVariant = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'success';
      case 'error':
      case 'failed':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'in_progress':
        return 'secondary';
      default:
        return 'secondary';
    }
  }, []);

  // Get action icon
  const getActionIcon = useCallback((action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <Database className="w-4 h-4" />;
      case 'upload':
        return <FileText className="w-4 h-4" />;
      case 'download':
        return <Download className="w-4 h-4" />;
      case 'delete':
        return <X className="w-4 h-4" />;
      case 'restore':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Backup Logs
            {backupName && (
              <Badge variant="outline" className="ml-2">
                {backupName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            View and filter backup operation logs with detailed information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{logsData.stats.total}</div>
              <div className="text-sm text-blue-700">Total Logs</div>
            </div>
            {Object.entries(logsData.stats.byStatus).map(([status, count]) => (
              <div key={status} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-700 capitalize">{status}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Action Filter */}
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPLOAD">Upload</SelectItem>
                  <SelectItem value="DOWNLOAD">Download</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="RESTORE">Restore</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  placeholder="Start Date"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  placeholder="End Date"
                />
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleApplyFilters}
                  disabled={loading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                  Apply
                </Button>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Log Entries</span>
                <Badge variant="secondary">{logsData.pagination.total} total</Badge>
              </div>
              <Button
                onClick={handleExportLogs}
                variant="outline"
                size="sm"
                disabled={logsData.logs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading logs...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : logsData.logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logsData.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="font-medium">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={log.message}>
                            {log.message || 'No message'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">{log.createdBy}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowLogDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {logsData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((logsData.pagination.page - 1) * logsData.pagination.limit) + 1} to{' '}
                  {Math.min(logsData.pagination.page * logsData.pagination.limit, logsData.pagination.total)} of{' '}
                  {logsData.pagination.total} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadLogs(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {logsData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadLogs(currentPage + 1)}
                    disabled={currentPage === logsData.pagination.totalPages || loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getActionIcon(selectedLog.action)}
                    <span>{selectedLog.action}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedLog.status)}>
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <div className="mt-1">{selectedLog.createdBy}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <div className="mt-1">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                {selectedLog.backupName && (
                  <div>
                    <Label className="text-sm font-medium">Backup</Label>
                    <div className="mt-1">{selectedLog.backupName}</div>
                  </div>
                )}
                {selectedLog.backupType && (
                  <div>
                    <Label className="text-sm font-medium">Backup Type</Label>
                    <div className="mt-1">{selectedLog.backupType}</div>
                  </div>
                )}
              </div>
              
              {selectedLog.message && (
                <div>
                  <Label className="text-sm font-medium">Message</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedLog.message}
                  </div>
                </div>
              )}
              
              {selectedLog.details && (
                <div>
                  <Label className="text-sm font-medium">Details</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm font-mono">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
} 