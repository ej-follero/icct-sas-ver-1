"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Mail, 
  Bell, 
  Send, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Megaphone,
  Calendar,
  Settings,
  Search,
  Filter,
  Plus,
  Archive,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  User,
  UserCheck,
  UserX,
  Zap,
  Activity,
  Target,
  BarChart3,
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
  Building2
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog, SortFieldOption } from '@/components/reusable/Dialogs/SortDialog';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ImportDialog } from '@/components/reusable/Dialogs/ImportDialog';
import { PrintLayout } from '@/components/PrintLayout';
import { useDebounce } from '@/hooks/use-debounce';
import Fuse from "fuse.js";
import React from "react";

interface CommunicationItem {
  id: string;
  type: 'message' | 'email' | 'announcement' | 'notification';
  title: string;
  content: string;
  sender: string;
  recipient: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  readCount?: number;
  totalRecipients?: number;
  avatar?: string;
}

interface ActivityItem {
  id: string;
  type: 'message_sent' | 'email_delivered' | 'announcement_posted' | 'notification_failed';
  description: string;
  timestamp: string;
  user: string;
  icon: JSX.Element;
  color: string;
}

const mockCommunications: CommunicationItem[] = [
  {
    id: '1',
    type: 'message',
    title: 'Attendance Alert - John Doe',
    content: 'Your child was absent from Mathematics class today.',
    sender: 'System',
    recipient: 'Parent',
    timestamp: '2025-01-15 08:30 AM',
    status: 'delivered',
    priority: 'high',
    readCount: 1,
    totalRecipients: 1,
    avatar: '/api/avatar/parent'
  },
  {
    id: '2',
    type: 'email',
    title: 'Weekly Attendance Report',
    content: 'Please find attached the weekly attendance report for your child.',
    sender: 'Admin',
    recipient: 'Parent',
    timestamp: '2025-01-14 05:00 PM',
    status: 'read',
    priority: 'normal',
    readCount: 45,
    totalRecipients: 50,
    avatar: '/api/avatar/admin'
  },
  {
    id: '3',
    type: 'announcement',
    title: 'Parent-Teacher Meeting',
    content: 'Parent-teacher meeting scheduled for next Friday at 3:00 PM.',
    sender: 'Principal',
    recipient: 'All Parents',
    timestamp: '2025-01-13 10:00 AM',
    status: 'sent',
    priority: 'normal',
    readCount: 120,
    totalRecipients: 150,
    avatar: '/api/avatar/principal'
  },
  {
    id: '4',
    type: 'notification',
    title: 'Late Arrival Notice',
    content: 'Your child arrived 15 minutes late to school today.',
    sender: 'System',
    recipient: 'Parent',
    timestamp: '2025-01-12 08:45 AM',
    status: 'failed',
    priority: 'urgent',
    readCount: 0,
    totalRecipients: 1,
    avatar: '/api/avatar/system'
  }
];

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'message_sent',
    description: 'Attendance alert sent to 15 parents',
    timestamp: '2 minutes ago',
    user: 'System',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-blue-600'
  },
  {
    id: '2',
    type: 'email_delivered',
    description: 'Weekly report delivered to 45 recipients',
    timestamp: '5 minutes ago',
    user: 'Admin',
    icon: <Mail className="w-4 h-4" />,
    color: 'text-green-600'
  },
  {
    id: '3',
    type: 'announcement_posted',
    description: 'New announcement posted: Parent-Teacher Meeting',
    timestamp: '10 minutes ago',
    user: 'Principal',
    icon: <Megaphone className="w-4 h-4" />,
    color: 'text-purple-600'
  },
  {
    id: '4',
    type: 'notification_failed',
    description: '3 notifications failed to deliver',
    timestamp: '15 minutes ago',
    user: 'System',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-red-600'
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

const getSenderInitials = (sender: string) => {
  return sender.split(' ').map(word => word[0]).join('').toUpperCase();
};

export default function CommunicationPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<'timestamp' | 'priority' | 'status' | 'type'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['type', 'title', 'sender', 'recipient', 'timestamp', 'status', 'priority']);
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<CommunicationItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'messages', 'email', 'announcements', 'logs'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Add Fuse.js setup for fuzzy search
  const fuse = useMemo(() => new Fuse<CommunicationItem>(mockCommunications, {
    keys: ["title", "content", "sender", "recipient"],
    threshold: 0.4,
    includeMatches: true,
  }), [mockCommunications]);

  const fuzzyResults = useMemo(() => {
    if (!searchQuery) return mockCommunications.map((c: CommunicationItem, i: number) => ({ item: c, refIndex: i }));
    return fuse.search(searchQuery);
  }, [searchQuery, fuse, mockCommunications]);

  // Enhanced filtering logic
  const filteredCommunications = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === filterPriority);
    }

    // Apply type filter based on active tab
    if (activeTab !== 'overview' && activeTab !== 'logs') {
      filtered = filtered.filter(item => item.type === activeTab.slice(0, -1)); // Remove 's' from end
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
          break;
        case 'status':
          const statusOrder = { sent: 1, delivered: 2, read: 3, failed: 4 };
          aValue = statusOrder[a.status as keyof typeof statusOrder];
          bValue = statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [fuzzyResults, filterStatus, filterPriority, activeTab, sortField, sortOrder]);

  // Pagination
  const paginatedCommunications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCommunications.slice(start, end);
  }, [filteredCommunications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCommunications.length / itemsPerPage);

  // Selection logic
  const isAllSelected = paginatedCommunications.length > 0 && paginatedCommunications.every(c => selectedItems.includes(c.id));
  const isIndeterminate = selectedItems.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedCommunications.map(c => c.id));
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
        setSearchQuery('');
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

  const stats = {
    totalSent: 1247,
    delivered: 1189,
    read: 987,
    failed: 58,
    successRate: ((1189 + 987) / 1247 * 100).toFixed(1),
    trend: '+12.5%',
    trendDirection: 'up'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Communication Hub"
          subtitle="Manage all communications and notifications"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Communication", href: "/communication" },
            { label: "Hub" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Send className="text-blue-500 w-5 h-5" />}
            label="Total Sent"
            value={stats.totalSent}
            valueClassName="text-blue-900"
            sublabel="Total communications sent"
          />
          <SummaryCard
            icon={<CheckCircle className="text-green-500 w-5 h-5" />}
            label="Delivered"
            value={stats.delivered}
            valueClassName="text-green-900"
            sublabel="Successfully delivered"
          />
          <SummaryCard
            icon={<Eye className="text-purple-500 w-5 h-5" />}
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
            subtitle="Essential communication tools"
            icon={
              <div className="w-6 h-6 text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
            }
            actionCards={[
              {
                id: 'new-message',
                label: 'New Message',
                description: 'Send a new message',
                icon: <MessageCircle className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle new message */ }
              },
              {
                id: 'send-email',
                label: 'Send Email',
                description: 'Compose and send email',
                icon: <Mail className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle email */ }
              },
              {
                id: 'post-announcement',
                label: 'Post Announcement',
                description: 'Create new announcement',
                icon: <Megaphone className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle announcement */ }
              },
              {
                id: 'send-notification',
                label: 'Send Notification',
                description: 'Send system notification',
                icon: <Bell className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle notification */ }
              },
              {
                id: 'print-reports',
                label: 'Print Reports',
                description: 'Print communication reports',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle print */ }
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload communication data',
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
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Communication List</h3>
                      <p className="text-blue-100 text-sm">Search and filter communication information</p>
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
                    placeholder="Search communications..."
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

            {/* Bulk Actions Bar */}
            {selectedItems.length > 0 && (
              <div className="mt-2 sm:mt-3 px-2 sm:px-3 lg:px-6 max-w-full">
                <BulkActionsBar
                  selectedCount={selectedItems.length}
                  entityLabel="communication"
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
                      tooltip: "Archive selected communications",
                      variant: "outline"
                    },
                    {
                      key: "delete",
                      label: "Delete Selected",
                      icon: <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: () => handleBulkAction('delete'),
                      tooltip: "Delete selected communications",
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
                  {!isLoading && filteredCommunications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<MessageCircle className="w-6 h-6 text-blue-400" />}
                        title="No communications found"
                        description="Try adjusting your search criteria or filters to find the communications you're looking for."
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
                      {paginatedCommunications.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                            aria-label={`Select ${item.title}`}
                          />
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={item.avatar} />
                            <AvatarFallback className="text-xs">
                              {getSenderInitials(item.sender)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{item.title}</h4>
                              <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{item.sender} → {item.recipient}</span>
                              <span>{item.timestamp}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                              {item.status}
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View communication"
                                    className="hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedCommunication(item);
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
                totalItems={filteredCommunications.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="communication"
              />
            </div>
          </Card>
        </div>

        {/* Dialogs */}
        <ViewDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedCommunication ? `${selectedCommunication.title}` : "Communication Details"}
          subtitle={selectedCommunication?.type}
          status={selectedCommunication ? {
            value: selectedCommunication.status,
            variant: selectedCommunication.status === "read" ? "success" : 
                    selectedCommunication.status === "delivered" ? "default" : 
                    selectedCommunication.status === "sent" ? "secondary" : "destructive"
          } : undefined}
          headerVariant="default"
          sections={selectedCommunication ? ([
            {
              title: "Communication Information",
              fields: [
                { label: 'ID', value: String(selectedCommunication.id), icon: <Hash className="w-4 h-4 text-blue-600" /> },
                { label: 'Title', value: selectedCommunication.title, icon: <MessageCircle className="w-4 h-4 text-blue-600" /> },
                { label: 'Type', value: selectedCommunication.type, icon: <Tag className="w-4 h-4 text-blue-600" /> },
                { label: 'Priority', value: selectedCommunication.priority, icon: <Layers className="w-4 h-4 text-blue-600" /> },
                { label: 'Status', value: selectedCommunication.status, icon: <Info className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Sender & Recipient",
              fields: [
                { label: 'Sender', value: selectedCommunication.sender, icon: <User className="w-4 h-4 text-blue-600" /> },
                { label: 'Recipient', value: selectedCommunication.recipient, icon: <UserCheck className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Timestamps",
              fields: [
                { label: 'Sent At', value: selectedCommunication.timestamp, type: 'date', icon: <Clock className="w-4 h-4 text-blue-600" /> },
              ]
            },
            selectedCommunication.content ? {
              title: "Content",
              fields: [
                { label: 'Content', value: selectedCommunication.content, icon: <FileText className="w-4 h-4 text-blue-600" /> },
              ]
            } : undefined
          ].filter(Boolean) as import('@/components/reusable/Dialogs/ViewDialog').ViewDialogSection[]) : []}
          description={selectedCommunication?.sender && selectedCommunication?.recipient ? `From: ${selectedCommunication.sender} → To: ${selectedCommunication.recipient}` : undefined}
          tooltipText="View detailed communication information"
        />

        <ConfirmDeleteDialog
          open={deleteModalOpen}
          onOpenChange={(open) => {
            setDeleteModalOpen(open);
            if (!open) setSelectedCommunication(null);
          }}
          itemName={selectedCommunication?.title}
          onDelete={() => { if (selectedCommunication) handleBulkAction('delete'); }}
          onCancel={() => { setDeleteModalOpen(false); setSelectedCommunication(null); }}
          canDelete={true}
          deleteError={undefined}
          description={selectedCommunication ? `Are you sure you want to delete the communication "${selectedCommunication.title}"? This action cannot be undone.` : undefined}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={paginatedCommunications.filter(item => selectedItems.includes(item.id))}
          entityType="course"
          entityLabel="communication"
          availableActions={[
            { type: 'status-update', title: 'Update Status', description: 'Update status of selected communications', icon: <Settings className="w-4 h-4" /> },
            { type: 'notification', title: 'Send Notification', description: 'Send notification to recipients', icon: <Bell className="w-4 h-4" /> },
            { type: 'export', title: 'Export Data', description: 'Export selected communications data', icon: <Download className="w-4 h-4" /> },
          ]}
          exportColumns={[
            { id: 'title', label: 'Title', default: true },
            { id: 'type', label: 'Type', default: true },
            { id: 'sender', label: 'Sender', default: true },
            { id: 'recipient', label: 'Recipient', default: true },
            { id: 'status', label: 'Status', default: true },
            { id: 'priority', label: 'Priority', default: true },
            { id: 'timestamp', label: 'Timestamp', default: true }
          ]}
          notificationTemplates={[]}
          stats={{
            total: selectedItems.length,
            active: paginatedCommunications.filter(c => (c.status === 'read' || c.status === 'delivered') && selectedItems.includes(c.id)).length,
            inactive: paginatedCommunications.filter(c => (c.status === 'sent' || c.status === 'failed') && selectedItems.includes(c.id)).length
          }}
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
          getItemDisplayName={item => item.title}
          getItemStatus={item => item.status}
        />
      </div>
    </div>
  );
} 