"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileBarChart2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal
} from "lucide-react";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface AuditLog {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
}

export default function AuditLogsPage() {
  const { user, isSuperAdmin, isAdmin, isSystemAuditor, loading } = useUser();
  const router = useRouter();
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (loading) return;
    
    if (!isSuperAdmin && !isAdmin && !isSystemAuditor) {
      toast.error("You don't have permission to access this page");
      router.push('/dashboard');
      return;
    }
    
    fetchAuditLogs();
  }, [loading, user, router]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/audit-logs');
      const data = await response.json();
      setAuditLogs(data.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-800">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'LOW':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (action.includes('UPDATE') || action.includes('EDIT')) {
      return <Activity className="w-4 h-4 text-blue-600" />;
    } else if (action.includes('DELETE') || action.includes('REMOVE')) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    } else if (action.includes('LOGIN') || action.includes('AUTH')) {
      return <User className="w-4 h-4 text-purple-600" />;
    } else {
      return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const auditLogColumns: TableListColumn<AuditLog>[] = [
    {
      header: "",
      accessor: "select" as const,
      width: 20,
      minWidth: 20,
      render: (log: AuditLog) => null // Will be handled by TableList
    },
    {
      header: "Action",
      accessor: "action" as const,
      width: 200,
      render: (log: AuditLog) => (
        <div className="flex items-center gap-3">
          {getActionIcon(log.action)}
          <div>
            <div className="font-semibold text-gray-900">{log.action}</div>
            <div className="text-sm text-gray-500">{log.resourceType}</div>
          </div>
        </div>
      )
    },
    {
      header: "User",
      accessor: "userName" as const,
      width: 150,
      render: (log: AuditLog) => (
        <div>
          <div className="font-semibold text-gray-900">{log.userName}</div>
          <div className="text-sm text-gray-500">{log.userEmail}</div>
        </div>
      )
    },
    {
      header: "Severity",
      accessor: "severity" as const,
      width: 100,
      render: (log: AuditLog) => (
        <div className="text-center">
          {getSeverityBadge(log.severity)}
        </div>
      )
    },
    {
      header: "Category",
      accessor: "category" as const,
      width: 120,
      render: (log: AuditLog) => (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {log.category}
          </Badge>
        </div>
      )
    },
    {
      header: "IP Address",
      accessor: "ipAddress" as const,
      width: 120,
      render: (log: AuditLog) => (
        <div className="text-center">
          <div className="text-sm font-mono text-gray-700">{log.ipAddress}</div>
        </div>
      )
    },
    {
      header: "Timestamp",
      accessor: "timestamp" as const,
      width: 150,
      render: (log: AuditLog) => (
        <div className="text-center">
          <div className="text-sm text-gray-700">
            {new Date(log.timestamp).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(log.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      header: "Actions",
      accessor: "actions" as const,
      width: 60,
      render: (log: AuditLog) => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => toast.info('View log details')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info('Export log')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-green-600" />
                <span>Export Log</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === auditLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(auditLogs.map(log => log.id));
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchInput || 
      log.action.toLowerCase().includes(searchInput.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchInput.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchInput.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchInput.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesSeverity && matchesCategory && matchesAction;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelected = selectedIds.length === auditLogs.length && auditLogs.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < auditLogs.length;

  // Calculate statistics
  const stats = {
    total: auditLogs.length,
    critical: auditLogs.filter(log => log.severity === 'CRITICAL').length,
    high: auditLogs.filter(log => log.severity === 'HIGH').length,
    medium: auditLogs.filter(log => log.severity === 'MEDIUM').length,
    low: auditLogs.filter(log => log.severity === 'LOW').length,
    today: auditLogs.filter(log => {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    }).length
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-6 py-4">
        <PageHeader
          title="Audit Logs"
          subtitle="View and analyze system activity logs for security and compliance"
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Audit Logs" }
          ]}
        />
      </div>

      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <SummaryCard
            icon={<FileBarChart2 className="text-blue-500 w-5 h-5" />}
            label="Total Logs"
            value={stats.total}
            valueClassName="text-blue-900"
            sublabel="All audit entries"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-red-500 w-5 h-5" />}
            label="Critical"
            value={stats.critical}
            valueClassName="text-red-900"
            sublabel="Critical events"
          />
          <SummaryCard
            icon={<Activity className="text-orange-500 w-5 h-5" />}
            label="High Priority"
            value={stats.high}
            valueClassName="text-orange-900"
            sublabel="High severity events"
          />
          <SummaryCard
            icon={<Clock className="text-green-500 w-5 h-5" />}
            label="Today"
            value={stats.today}
            valueClassName="text-green-900"
            sublabel="Events today"
          />
          <SummaryCard
            icon={<User className="text-purple-500 w-5 h-5" />}
            label="Users"
            value={new Set(auditLogs.map(log => log.userId)).size}
            valueClassName="text-purple-900"
            sublabel="Active users"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsPanel
          variant="premium"
          title="Audit Log Actions"
          subtitle="Manage and analyze audit logs"
          icon={<FileBarChart2 className="w-6 h-6 text-white" />}
          actionCards={[
            {
              id: 'refresh-logs',
              label: 'Refresh Logs',
              description: 'Reload audit log data',
              icon: <RefreshCw className="w-5 h-5 text-white" />,
              onClick: fetchAuditLogs
            },
            {
              id: 'export-logs',
              label: 'Export Logs',
              description: 'Download audit log data',
              icon: <Download className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Export functionality coming soon')
            },
            {
              id: 'filter-logs',
              label: 'Advanced Filter',
              description: 'Apply complex filters',
              icon: <Filter className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Advanced filtering coming soon')
            }
          ]}
          lastActionTime="2 minutes ago"
          onLastActionTimeChange={() => {}}
          collapsible={true}
          defaultCollapsed={true}
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                  <SelectItem value="USER_MANAGEMENT">User Management</SelectItem>
                  <SelectItem value="SYSTEM_SETTINGS">System Settings</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Audit Logs</CardTitle>
                <p className="text-blue-100 text-sm">System activity and security events</p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {auditLogs.length} logs
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TableList
              columns={auditLogColumns}
              data={paginatedLogs}
              loading={isLoading}
              selectedIds={selectedIds}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              getItemId={(item) => item.id}
              className="border-0 shadow-none"
            />
            <TablePagination
              page={currentPage}
              pageSize={itemsPerPage}
              totalItems={filteredLogs.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setItemsPerPage}
              entityLabel="audit log"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}