'use client';

import { useState, useCallback, useMemo, useEffect } from "react";
import { eventsData, role } from "@/lib/data";
import { Filter, SortAsc, Plus, Pencil, Trash2, Search, AlertCircle, Calendar, CheckCircle, XCircle, ArrowUpDown, Settings, Download, RefreshCw, Printer, Upload, List, Columns3, Eye, Megaphone, TrendingUp, TrendingDown, Users, FileText, Clock, Info, Hash, Tag, Layers, User, UserCheck, X, Loader2, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import TableSearch from "@/components/reusable/Search/TableSearch";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/reusable";
import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TablePagination } from "@/components/reusable/Table/TablePagination";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Event type
type Event = {
  id: number;
  title: string;
  class: string;
  date: string;
  startTime: string;
  endTime: string;
};

type SortField = 'title' | 'class' | 'date' | 'startTime' | 'endTime';
type SortOrder = 'asc' | 'desc';

const columns = [
  { header: "Title", accessor: "title" },
  { header: "Class", accessor: "class" },
  { header: "Date", accessor: "date", className: "hidden md:table-cell" },
  { header: "Start Time", accessor: "startTime", className: "hidden md:table-cell" },
  { header: "End Time", accessor: "endTime", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const eventSortFieldOptions: SortFieldOption<string>[] = [
  { value: 'title', label: 'Title' },
  { value: 'class', label: 'Class' },
  { value: 'date', label: 'Date' },
  { value: 'startTime', label: 'Start Time' },
  { value: 'endTime', label: 'End Time' },
];

const EventListPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['title', 'class', 'date', 'startTime', 'endTime']);
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
  const fuse = useMemo(() => new Fuse(eventsData, {
    keys: ["title", "class"],
    threshold: 0.4,
    includeMatches: true,
  }), [eventsData]);

  const fuzzyResults = useMemo(() => {
    if (!searchValue) return eventsData.map((a, i: number) => ({ item: a, refIndex: i }));
    return fuse.search(searchValue);
  }, [searchValue, fuse, eventsData]);

  // Enhanced filtering logic
  const filteredEvents = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(item => item.class === classFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const modifier = sortOrder === "asc" ? 1 : -1;
      if (sortField === "date") {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * modifier;
      }
      return (a[sortField] > b[sortField] ? 1 : -1) * modifier;
    });

    return filtered;
  }, [fuzzyResults, classFilter, sortField, sortOrder]);

  // Pagination
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredEvents.slice(start, end);
  }, [filteredEvents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  // Selection logic
  const isAllSelected = paginatedEvents.length > 0 && paginatedEvents.every(e => selectedItems.includes(e.id.toString()));
  const isIndeterminate = selectedItems.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedEvents.map(e => e.id.toString()));
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

  const handleDelete = (id: number) => {
    // Handle delete logic here
    setDeleteConfirm(null);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortOrder === "asc" ? 
      <ChevronDown className="w-4 h-4 ml-1 text-primary" /> : 
      <ChevronDown className="w-4 h-4 ml-1 text-primary transform rotate-180" />;
  };

  const stats = {
    totalEvents: eventsData.length,
    upcoming: eventsData.filter(e => new Date(e.date) > new Date()).length,
    today: eventsData.filter(e => {
      const eventDate = new Date(e.date);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length,
    past: eventsData.filter(e => new Date(e.date) < new Date()).length,
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Events"
          subtitle="View and manage all events"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Events" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Calendar className="text-blue-500 w-5 h-5" />}
            label="Total Events"
            value={stats.totalEvents}
            valueClassName="text-blue-900"
            sublabel="All events"
          />
          <SummaryCard
            icon={<TrendingUp className="text-green-500 w-5 h-5" />}
            label="Upcoming"
            value={stats.upcoming}
            valueClassName="text-green-900"
            sublabel="Future events"
          />
          <SummaryCard
            icon={<Clock className="text-yellow-500 w-5 h-5" />}
            label="Today"
            value={stats.today}
            valueClassName="text-yellow-900"
            sublabel="Events today"
          />
          <SummaryCard
            icon={<CheckCircle className="text-gray-500 w-5 h-5" />}
            label="Past"
            value={stats.past}
            valueClassName="text-gray-900"
            sublabel="Completed events"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential event tools"
            icon={
              <div className="w-6 h-6 text-white">
                <Calendar className="w-6 h-6" />
              </div>
            }
            actionCards={[
              {
                id: 'new-event',
                label: 'New Event',
                description: 'Create new event',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle new event */ }
              },
              {
                id: 'import-events',
                label: 'Import Data',
                description: 'Import events from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-events',
                label: 'Print Page',
                description: 'Print event list',
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
                description: 'Reload event data',
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
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Event List</h3>
                      <p className="text-blue-100 text-sm">Search and filter event information</p>
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
                    placeholder="Search events..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={classFilter} onValueChange={(value) => setClassFilter(value)}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {Array.from(new Set(eventsData.map(e => e.class))).map(class_name => (
                        <SelectItem key={class_name} value={class_name}>{class_name}</SelectItem>
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
                  entityLabel="event"
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
                      icon: <XCircle className="w-4 h-4 mr-2" />,
                      onClick: () => handleBulkAction('archive'),
                      tooltip: "Archive selected events",
                      variant: "outline"
                    },
                    {
                      key: "delete",
                      label: "Delete Selected",
                      icon: <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: () => handleBulkAction('delete'),
                      tooltip: "Delete selected events",
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
                  {!isLoading && filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<Calendar className="w-6 h-6 text-blue-400" />}
                        title="No events found"
                        description="Try adjusting your search criteria or filters to find the events you're looking for."
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
                      {paginatedEvents.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedItems.includes(item.id.toString())}
                            onCheckedChange={() => handleSelectItem(item.id.toString())}
                            aria-label={`Select ${item.title}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{item.title}</h4>
                              <Badge className="text-xs bg-blue-100 text-blue-700">
                                {item.class}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{item.date}</span>
                              <span>{item.startTime} - {item.endTime}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View event"
                                    className="hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedEvent(item);
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
                totalItems={filteredEvents.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="event"
              />
            </div>
          </Card>
        </div>

        {/* Dialogs */}
        <ViewDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedEvent ? `${selectedEvent.title}` : "Event Details"}
          subtitle={selectedEvent?.class}
          headerVariant="default"
          sections={selectedEvent ? ([
            {
              title: "Event Information",
              fields: [
                { label: 'ID', value: String(selectedEvent.id), icon: <Hash className="w-4 h-4 text-blue-600" /> },
                { label: 'Title', value: selectedEvent.title, icon: <Calendar className="w-4 h-4 text-blue-600" /> },
                { label: 'Class', value: selectedEvent.class, icon: <Tag className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Schedule",
              fields: [
                { label: 'Date', value: selectedEvent.date, type: 'date', icon: <Clock className="w-4 h-4 text-blue-600" /> },
                { label: 'Start Time', value: selectedEvent.startTime, icon: <Info className="w-4 h-4 text-blue-600" /> },
                { label: 'End Time', value: selectedEvent.endTime, icon: <Info className="w-4 h-4 text-blue-600" /> },
              ]
            }
          ] as import('@/components/reusable/Dialogs/ViewDialog').ViewDialogSection[]) : []}
          description={selectedEvent?.class ? `Class: ${selectedEvent.class}` : undefined}
          tooltipText="View detailed event information"
        />

        <ConfirmDeleteDialog
          open={deleteModalOpen}
          onOpenChange={(open) => {
            setDeleteModalOpen(open);
            if (!open) setSelectedEvent(null);
          }}
          itemName={selectedEvent?.title}
          onDelete={() => { if (selectedEvent) handleBulkAction('delete'); }}
          onCancel={() => { setDeleteModalOpen(false); setSelectedEvent(null); }}
          canDelete={true}
          deleteError={undefined}
          description={selectedEvent ? `Are you sure you want to delete the event "${selectedEvent.title}"? This action cannot be undone.` : undefined}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={paginatedEvents.filter(item => selectedItems.includes(item.id.toString()))}
          entityType="course"
          entityLabel="event"
          availableActions={[
            { type: 'status-update', title: 'Update Status', description: 'Update status of selected events', icon: <Settings className="w-4 h-4" /> },
            { type: 'notification', title: 'Send Notification', description: 'Send notification to participants', icon: <Bell className="w-4 h-4" /> },
            { type: 'export', title: 'Export Data', description: 'Export selected events data', icon: <Download className="w-4 h-4" /> },
          ]}
          exportColumns={[
            { id: 'title', label: 'Title', default: true },
            { id: 'class', label: 'Class', default: true },
            { id: 'date', label: 'Date', default: true },
            { id: 'startTime', label: 'Start Time', default: true },
            { id: 'endTime', label: 'End Time', default: true }
          ]}
          notificationTemplates={[]}
          stats={{
            total: selectedItems.length,
            active: selectedItems.length,
            inactive: 0
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
          getItemStatus={item => 'active'}
        />

        {/* Legacy dialogs for backward compatibility */}
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EventListPage;
