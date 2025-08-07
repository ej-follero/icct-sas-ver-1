"use client";

import { useState, useMemo } from "react";
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

const mockCommunicationLogs: CommunicationLog[] = [
  {
    id: '1',
    type: 'message',
    title: 'Attendance Alert - John Doe',
    sender: 'System',
    recipient: 'Parent',
    timestamp: '2025-01-15 08:30 AM',
    status: 'delivered',
    priority: 'high',
    content: 'Your child was absent from Mathematics class today.',
    readCount: 1,
    totalRecipients: 1,
    deliveryTime: 2.5
  },
  {
    id: '2',
    type: 'email',
    title: 'Weekly Attendance Report',
    sender: 'Admin',
    recipient: 'Parent',
    timestamp: '2025-01-14 05:00 PM',
    status: 'read',
    priority: 'normal',
    content: 'Please find attached the weekly attendance report for your child.',
    readCount: 45,
    totalRecipients: 50,
    deliveryTime: 1.8
  },
  {
    id: '3',
    type: 'announcement',
    title: 'Parent-Teacher Meeting',
    sender: 'Principal',
    recipient: 'All Parents',
    timestamp: '2025-01-13 10:00 AM',
    status: 'sent',
    priority: 'normal',
    content: 'Parent-teacher meeting scheduled for next Friday at 3:00 PM.',
    readCount: 120,
    totalRecipients: 150,
    deliveryTime: 3.2
  },
  {
    id: '4',
    type: 'notification',
    title: 'Late Arrival Notice',
    sender: 'System',
    recipient: 'Parent',
    timestamp: '2025-01-12 08:45 AM',
    status: 'failed',
    priority: 'urgent',
    content: 'Your child arrived 15 minutes late to school today.',
    readCount: 0,
    totalRecipients: 1,
    deliveryTime: 0,
    errorMessage: 'Recipient email address not found'
  }
];

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

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    let filtered = mockCommunicationLogs;

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

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(log => log.priority === filterPriority);
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast.success("Logs refreshed successfully!");
  };

  const stats = {
    totalLogs: mockCommunicationLogs.length,
    sent: mockCommunicationLogs.filter(log => log.status === 'sent').length,
    delivered: mockCommunicationLogs.filter(log => log.status === 'delivered').length,
    read: mockCommunicationLogs.filter(log => log.status === 'read').length,
    failed: mockCommunicationLogs.filter(log => log.status === 'failed').length,
    successRate: ((mockCommunicationLogs.filter(log => log.status === 'read' || log.status === 'delivered').length / mockCommunicationLogs.length) * 100).toFixed(1)
  };

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
            icon={<CheckCircle className="text-green-500 w-5 h-5" />}
            label="Success Rate"
            value={`${stats.successRate}%`}
            valueClassName="text-green-900"
            sublabel="Successfully delivered"
          />
          <SummaryCard
            icon={<Activity className="text-purple-500 w-5 h-5" />}
            label="Read"
            value={stats.read}
            valueClassName="text-purple-900"
            sublabel="Communications read"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-red-500 w-5 h-5" />}
            label="Failed"
            value={stats.failed}
            valueClassName="text-red-900"
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
                onClick: () => toast.success("Export feature coming soon!")
              },
              {
                id: 'print-logs',
                label: 'Print Logs',
                description: 'Print log reports',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => toast.success("Print feature coming soon!")
              },
              {
                id: 'archive-logs',
                label: 'Archive Logs',
                description: 'Archive old logs',
                icon: <Archive className="w-5 h-5 text-white" />,
                onClick: () => toast.success("Archive feature coming soon!")
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
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-end">
                {/* Search Bar */}
                <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {/* Loader overlay when refreshing */}
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <RefreshCw className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {!isRefreshing && filteredLogs.length === 0 ? (
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
                    <div className="space-y-3">
                      {paginatedLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedItems.includes(log.id)}
                            onCheckedChange={() => handleSelectItem(log.id)}
                            aria-label={`Select ${log.title}`}
                          />
                          <div className="flex items-center gap-2">
                            {getTypeIcon(log.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{log.title}</h4>
                              <Badge className={`text-xs ${getPriorityColor(log.priority)}`}>
                                {log.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{log.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{log.sender} → {log.recipient}</span>
                              <span>{log.timestamp}</span>
                              {log.deliveryTime && (
                                <span>Delivery: {log.deliveryTime}s</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                              {log.status}
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View log details"
                                    className="hover:bg-blue-50"
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
      </div>
    </div>
  );
} 