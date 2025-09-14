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
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
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


// All communications are fetched from real API endpoints

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
  const [communications, setCommunications] = useState<CommunicationItem[]>([]);
  const [totalCommunications, setTotalCommunications] = useState(0);
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    successRate: '0.0',
    trend: '+12.5%',
    trendDirection: 'up' as const,
  });

  // Fetch communications from API
  const fetchCommunications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sortBy: sortField,
        sortOrder: sortOrder,
        search: searchQuery,
        ...(filterPriority !== 'all' && { priority: filterPriority.toUpperCase() }),
        ...(activeTab !== 'overview' && activeTab !== 'logs' && { type: activeTab.slice(0, -1) }),
      });

      const response = await fetch(`/api/communications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch communications');
      }

      const data = await response.json();
      setCommunications(data.items || []);
      setTotalCommunications(data.total || 0);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching communications:', error);
      toast.error('Failed to fetch communications. Please try again.');
      setCommunications([]);
      setTotalCommunications(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCommunications();
  }, [currentPage, itemsPerPage, sortField, sortOrder, searchQuery, filterPriority, activeTab]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'messages', 'email', 'announcements', 'logs'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Add Fuse.js setup for fuzzy search using real data
  const fuse = useMemo(() => new Fuse<CommunicationItem>(communications, {
    keys: ["title", "content", "sender", "recipient"],
    threshold: 0.4,
    includeMatches: true,
  }), [communications]);

  const fuzzyResults = useMemo(() => {
    if (!searchQuery) return communications.map((c: CommunicationItem, i: number) => ({ item: c, refIndex: i }));
    return fuse.search(searchQuery);
  }, [searchQuery, fuse, communications]);

  // Enhanced filtering logic
  const filteredCommunications = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply priority filter (API already handles this, but keep for client-side refinement)
    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority.toLowerCase() === filterPriority.toLowerCase());
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
  }, [fuzzyResults, filterPriority, activeTab, sortField, sortOrder]);

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
    try {
      await fetchCommunications();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
    setIsRefreshing(false);
    }
  };

  const handleBulkAction = async (action: 'archive' | 'delete' | 'status-update' | 'notification' | 'export') => {
    if (selectedItems.length === 0) return;
    
    setIsLoading(true);
    try {
      switch (action) {
        case 'delete':
          // Delete multiple communications
          const deletePromises = selectedItems.map(id => 
            fetch(`/api/communications/${id}`, { method: 'DELETE' })
          );
          await Promise.all(deletePromises);
          toast.success(`Successfully deleted ${selectedItems.length} communications`);
          break;
          
        case 'archive':
          // Archive multiple communications (update status)
          const archivePromises = selectedItems.map(id => 
            fetch(`/api/communications/${id}`, { 
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'archived' })
            })
          );
          await Promise.all(archivePromises);
          toast.success(`Successfully archived ${selectedItems.length} communications`);
          break;
          
        case 'status-update':
          // Update status of multiple communications
          const statusUpdatePromises = selectedItems.map(id => 
            fetch(`/api/communications/${id}`, { 
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'read' })
            })
          );
          await Promise.all(statusUpdatePromises);
          toast.success(`Successfully updated status for ${selectedItems.length} communications`);
          break;
          
        case 'notification':
          // Send notifications (simulated for now)
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success(`Notifications sent for ${selectedItems.length} communications`);
          break;
          
        case 'export':
          // Export selected communications
          const selectedCommunications = communications.filter(comm => selectedItems.includes(comm.id));
          const exportData = selectedCommunications.map(comm => ({
            title: comm.title,
            type: comm.type,
            sender: comm.sender,
            recipient: comm.recipient,
            timestamp: comm.timestamp,
            status: comm.status,
            priority: comm.priority
          }));
          
          const csvContent = [
            Object.keys(exportData[0]).join(','),
            ...exportData.map(row => Object.values(row).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `communications-export-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          toast.success(`Exported ${selectedItems.length} communications`);
          break;
          
        default:
          toast.error('Unknown bulk action');
      }
      
      // Refresh the communications list
      fetchCommunications();
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats are now managed in state and fetched from API

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
             icon={<CheckCircle className="text-blue-500 w-5 h-5" />}
             label="Delivered"
             value={stats.delivered}
             valueClassName="text-blue-900"
             sublabel="Successfully delivered"
           />
           <SummaryCard
             icon={<Eye className="text-blue-500 w-5 h-5" />}
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
            
            {/* Clean Search and Filter Section */}
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
                    aria-label="Select all communications"
                    className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Select All ({paginatedCommunications.length})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                 {/* Search Bar */}
                 <div className="relative w-64">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input
                     type="text"
                     placeholder="Search communications..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                   />
                 </div>

                  {/* Priority Filter */}
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32 border-gray-300 rounded text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
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
              <div className="overflow-x-auto bg-white/70 shadow-none relative min-h-[400px]">
                {/* Loader overlay when refreshing */}
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {!isLoading && filteredCommunications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="text-center max-w-md">
                        
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {searchQuery || filterPriority !== 'all' 
                            ? 'No communications match your criteria' 
                            : 'No communications found'}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-gray-600 mb-6">
                          {searchQuery || filterPriority !== 'all' 
                            ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                            : 'There are no communications in the system yet. Create your first communication to get started.'}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          {searchQuery || filterPriority !== 'all' ? (
                            <>
                             <Button
                               variant="outline"
                                 onClick={() => {
                                   setSearchQuery('');
                                   setFilterPriority('all');
                                 }}
                                 className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                               >
                                 <RotateCcw className="w-4 h-4 mr-2" />
                                 Clear Filters
                               </Button>
                               <Button
                                 variant="outline"
                               onClick={() => handleRefresh()}
                                 className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                             >
                               <RefreshCw className="w-4 h-4 mr-2" />
                               Refresh Data
                             </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="default"
                                onClick={() => {/* Handle new communication */}}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Communication
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRefresh()}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Data
                              </Button>
                            </>
                          )}
                          </div>
                        
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paginatedCommunications.map((item, index) => (
                        <div
                          key={item.id}
                          className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            setSelectedCommunication(item);
                            setViewModalOpen(true);
                          }}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-4 left-4 z-10">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                              onCheckedChange={(checked) => {
                                if (checked !== undefined) {
                                  handleSelectItem(item.id);
                                }
                              }}
                            aria-label={`Select ${item.title}`}
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
                                       {item.title}
                                     </h4>
                                    <Badge className={`text-xs font-medium px-2 py-1 ${getPriorityColor(item.priority)} hover:${getPriorityColor(item.priority)}`}>
                                      {item.priority.toUpperCase()}
                              </Badge>
                            </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                    {item.content}
                                  </p>
                            </div>
                                
                                {/* Status Badge */}
                                <div className="flex-shrink-0 ml-4">
                                  <Badge className={`text-xs font-medium px-3 py-1 ${getStatusColor(item.status)} hover:${getStatusColor(item.status)}`}>
                                    {item.status.toUpperCase()}
                            </Badge>
                                </div>
                              </div>

                               {/* Metadata Row */}
                               <div className="flex items-center justify-between text-xs text-gray-500">
                                 <div className="flex items-center gap-4">
                                   {/* Sender Info */}
                                   <div className="flex items-center gap-1">
                                     <span className="font-medium text-gray-700">{item.sender}</span>
                                   </div>
                                   
                                   {/* Arrow */}
                                   <span className="text-gray-400">→</span>
                                   
                                   {/* Recipient Info */}
                                   <div className="flex items-center gap-1">
                                     <span className="font-medium text-gray-700">{item.recipient}</span>
                                   </div>
                                 </div>

                                 {/* Timestamp */}
                                 <div className="flex items-center gap-1 text-gray-500">
                                   <span>{new Date(item.timestamp).toLocaleDateString('en-US', { 
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
                                     <span className="capitalize">{item.type}</span>
                                   </div>
                                   
                                   {/* Read Count (if available) */}
                                   {item.readCount !== undefined && (
                                     <div className="flex items-center gap-1">
                                       <span>{item.readCount} read</span>
                                     </div>
                                   )}
                                   
                                   {/* Total Recipients (if available) */}
                                   {item.totalRecipients !== undefined && (
                                     <div className="flex items-center gap-1">
                                       <span>{item.totalRecipients} recipients</span>
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
                                           aria-label="View communication details"
                                           className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                       setSelectedCommunication(item);
                                       setViewModalOpen(true);
                                     }}
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
                                           aria-label="Delete communication"
                                           className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                       setSelectedCommunication(item);
                                       setDeleteModalOpen(true);
                                     }}
                                   >
                                           <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                       <TooltipContent side="top" align="center" className="bg-blue-900 text-white text-xs">
                                   Delete communication
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
                totalItems={filteredCommunications.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="communication"
                className="border-t border-gray-100 bg-gray-50/30"
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
             { id: 'status-update', label: 'Update Status', description: 'Update status of selected communications', icon: <Settings className="w-4 h-4" />, tabId: 'status-update' },
             { id: 'notification', label: 'Send Notification', description: 'Send notification to recipients', icon: <Bell className="w-4 h-4" />, tabId: 'notification' },
             { id: 'export', label: 'Export Data', description: 'Export selected communications data', icon: <Download className="w-4 h-4" />, tabId: 'export' },
           ]}
          onActionComplete={(actionType: string, results: any) => {
            handleBulkAction(actionType as any);
            setBulkActionsDialogOpen(false);
          }}
          onCancel={() => {
            setBulkActionsDialogOpen(false);
          }}
          onProcessAction={async (actionType: string, config: any) => {
            await handleBulkAction(actionType as any);
            return { success: true, processed: selectedItems.length };
          }}
          getItemDisplayName={item => item.title}
          getItemStatus={item => item.status}
          getItemId={item => item.id}
        />
      </div>
    </div>
  );
} 