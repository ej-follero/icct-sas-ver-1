"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Pagination } from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/reusable/Search/TableSearch";
import { announcementsData, role } from "@/lib/data";
import { EmptyState } from "@/components/reusable";
import { Announcement, AnnouncementStatus } from "@/types/announcement";
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Filter, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  Search, 
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Settings,
  Download,
  RefreshCw,
  Printer,
  Upload,
  List,
  Columns3,
  Eye,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  Info,
  Hash,
  Tag,
  Layers,
  User,
  UserCheck,
  X,
  Loader2
} from "lucide-react";
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

type SortField = 'date' | 'title' | 'class' | 'status';
type SortOrder = 'asc' | 'desc';

const columns = [
  {
    header: "Title",
    accessor: "title",
    sortable: true,
  },
  {
    header: "Class",
    accessor: "class",
    sortable: true,
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
    sortable: true,
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
    sortable: true,
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const statusColors = {
  important: { bg: "bg-red-100", text: "text-red-700", hover: "hover:bg-red-200" },
  normal: { bg: "bg-blue-100", text: "text-blue-700", hover: "hover:bg-blue-200" },
  archived: { bg: "bg-gray-100", text: "text-gray-700", hover: "hover:bg-gray-200" },
};

const announcementSortFieldOptions: SortFieldOption<string>[] = [
  { value: 'title', label: 'Title' },
  { value: 'class', label: 'Class' },
  { value: 'date', label: 'Date' },
  { value: 'status', label: 'Status' },
];

const AnnouncementListPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "all">("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['title', 'class', 'date', 'status']);
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
  const fuse = useMemo(() => new Fuse(announcementsData, {
    keys: ["title", "description", "class"],
    threshold: 0.4,
    includeMatches: true,
  }), [announcementsData]);

  const fuzzyResults = useMemo(() => {
    if (!searchValue) return announcementsData.map((a, i: number) => ({ item: a, refIndex: i }));
    return fuse.search(searchValue);
  }, [searchValue, fuse, announcementsData]);

  // Enhanced filtering logic
  const filteredAnnouncements = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
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
  }, [fuzzyResults, statusFilter, sortField, sortOrder]);

  // Pagination
  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAnnouncements.slice(start, end);
  }, [filteredAnnouncements, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  // Selection logic
  const isAllSelected = paginatedAnnouncements.length > 0 && paginatedAnnouncements.every(a => selectedItems.includes(a.id.toString()));
  const isIndeterminate = selectedItems.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedAnnouncements.map(a => a.id.toString()));
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

  const renderRow = (item: Announcement) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50/50 text-sm hover:bg-slate-100 transition-colors cursor-pointer group"
      onClick={() => setSelectedAnnouncement(item)}
    >
      <td className="flex items-center gap-4 p-4">
        <Checkbox
          checked={selectedItems.includes(item.id.toString())}
          onCheckedChange={() => handleSelectItem(item.id.toString())}
          aria-label={`Select ${item.title}`}
          onClick={(e) => e.stopPropagation()}
        />
        <div>
          <div className="font-medium group-hover:text-primary transition-colors">
            {item.title}
            {item.updatedAt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="ml-2 text-xs">Updated</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Last updated: {item.updatedAt}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>
        </div>
      </td>
      <td>
        <Badge variant="outline" className="group-hover:border-primary transition-colors">
          {item.class}
        </Badge>
      </td>
      <td className="hidden md:table-cell text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {item.date}
        </div>
      </td>
      <td className="hidden md:table-cell">
        <Badge 
          variant="secondary" 
          className={`${statusColors[item.status].bg} ${statusColors[item.status].text} ${statusColors[item.status].hover}`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      </td>
      <td>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-blue-50 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnouncement(item);
                    setViewModalOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View announcement</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {role === "admin" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-blue-50 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit announcement</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(item.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete announcement</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const stats = {
    totalAnnouncements: announcementsData.length,
    important: announcementsData.filter(a => a.status === 'important').length,
    normal: announcementsData.filter(a => a.status === 'normal').length,
    archived: announcementsData.filter(a => a.status === 'archived').length,
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
          title="Announcements"
          subtitle="View and manage all announcements"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Announcements" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Megaphone className="text-blue-500 w-5 h-5" />}
            label="Total Announcements"
            value={stats.totalAnnouncements}
            valueClassName="text-blue-900"
            sublabel="All announcements"
          />
          <SummaryCard
            icon={<AlertCircle className="text-red-500 w-5 h-5" />}
            label="Important"
            value={stats.important}
            valueClassName="text-red-900"
            sublabel="High priority announcements"
          />
          <SummaryCard
            icon={<CheckCircle className="text-green-500 w-5 h-5" />}
            label="Normal"
            value={stats.normal}
            valueClassName="text-green-900"
            sublabel="Regular announcements"
          />
          <SummaryCard
            icon={<XCircle className="text-gray-500 w-5 h-5" />}
            label="Archived"
            value={stats.archived}
            valueClassName="text-gray-900"
            sublabel="Archived announcements"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential announcement tools"
            icon={
              <div className="w-6 h-6 text-white">
                <Megaphone className="w-6 h-6" />
              </div>
            }
            actionCards={[
              {
                id: 'new-announcement',
                label: 'New Announcement',
                description: 'Create new announcement',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => { /* Handle new announcement */ }
              },
              {
                id: 'import-announcements',
                label: 'Import Data',
                description: 'Import announcements from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-announcements',
                label: 'Print Page',
                description: 'Print announcement list',
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
                description: 'Reload announcement data',
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
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Announcement List</h3>
                      <p className="text-blue-100 text-sm">Search and filter announcement information</p>
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
                    placeholder="Search announcements..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AnnouncementStatus | "all")}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
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
                  entityLabel="announcement"
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
                      tooltip: "Archive selected announcements",
                      variant: "outline"
                    },
                    {
                      key: "delete",
                      label: "Delete Selected",
                      icon: <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: () => handleBulkAction('delete'),
                      tooltip: "Delete selected announcements",
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
                  {!isLoading && filteredAnnouncements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<Megaphone className="w-6 h-6 text-blue-400" />}
                        title="No announcements found"
                        description="Try adjusting your search criteria or filters to find the announcements you're looking for."
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
                      {paginatedAnnouncements.map((item) => (
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
                              <Badge className={`text-xs ${statusColors[item.status as keyof typeof statusColors].bg} ${statusColors[item.status as keyof typeof statusColors].text}`}>
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{item.class}</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View announcement"
                                    className="hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedAnnouncement(item);
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
                totalItems={filteredAnnouncements.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="announcement"
              />
            </div>
          </Card>
        </div>

        {/* Dialogs */}
        <ViewDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedAnnouncement ? `${selectedAnnouncement.title}` : "Announcement Details"}
          subtitle={selectedAnnouncement?.class}
          status={selectedAnnouncement ? {
            value: selectedAnnouncement.status,
            variant: selectedAnnouncement.status === "important" ? "destructive" : 
                    selectedAnnouncement.status === "normal" ? "default" : "secondary"
          } : undefined}
          headerVariant="default"
          sections={selectedAnnouncement ? ([
            {
              title: "Announcement Information",
              fields: [
                { label: 'ID', value: String(selectedAnnouncement.id), icon: <Hash className="w-4 h-4 text-blue-600" /> },
                { label: 'Title', value: selectedAnnouncement.title, icon: <Megaphone className="w-4 h-4 text-blue-600" /> },
                { label: 'Class', value: selectedAnnouncement.class, icon: <Tag className="w-4 h-4 text-blue-600" /> },
                { label: 'Status', value: selectedAnnouncement.status, icon: <Layers className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Timestamps",
              fields: [
                { label: 'Date', value: selectedAnnouncement.date, type: 'date', icon: <Clock className="w-4 h-4 text-blue-600" /> },
                { label: 'Created At', value: selectedAnnouncement.createdAt, type: 'date', icon: <Info className="w-4 h-4 text-blue-600" /> },
              ]
            },
            selectedAnnouncement.description ? {
              title: "Content",
              fields: [
                { label: 'Description', value: selectedAnnouncement.description, icon: <FileText className="w-4 h-4 text-blue-600" /> },
              ]
            } : undefined
          ].filter(Boolean) as import('@/components/reusable/Dialogs/ViewDialog').ViewDialogSection[]) : []}
          description={selectedAnnouncement?.class ? `Class: ${selectedAnnouncement.class}` : undefined}
          tooltipText="View detailed announcement information"
        />

        <ConfirmDeleteDialog
          open={deleteModalOpen}
          onOpenChange={(open) => {
            setDeleteModalOpen(open);
            if (!open) setSelectedAnnouncement(null);
          }}
          itemName={selectedAnnouncement?.title}
          onDelete={() => { if (selectedAnnouncement) handleBulkAction('delete'); }}
          onCancel={() => { setDeleteModalOpen(false); setSelectedAnnouncement(null); }}
          canDelete={true}
          deleteError={undefined}
          description={selectedAnnouncement ? `Are you sure you want to delete the announcement "${selectedAnnouncement.title}"? This action cannot be undone.` : undefined}
        />

        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={paginatedAnnouncements.filter(item => selectedItems.includes(item.id.toString()))}
          entityType="course"
          entityLabel="announcement"
          availableActions={[
            { type: 'status-update', title: 'Update Status', description: 'Update status of selected announcements', icon: <Settings className="w-4 h-4" /> },
            { type: 'notification', title: 'Send Notification', description: 'Send notification to recipients', icon: <Bell className="w-4 h-4" /> },
            { type: 'export', title: 'Export Data', description: 'Export selected announcements data', icon: <Download className="w-4 h-4" /> },
          ]}
          exportColumns={[
            { id: 'title', label: 'Title', default: true },
            { id: 'class', label: 'Class', default: true },
            { id: 'status', label: 'Status', default: true },
            { id: 'date', label: 'Date', default: true }
          ]}
          notificationTemplates={[]}
          stats={{
            total: selectedItems.length,
            active: paginatedAnnouncements.filter(a => (a.status === 'normal' || a.status === 'important') && selectedItems.includes(a.id.toString())).length,
            inactive: paginatedAnnouncements.filter(a => a.status === 'archived' && selectedItems.includes(a.id.toString())).length
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

        {/* Legacy dialogs for backward compatibility */}
        {/* Announcement Details Dialog */}
        <Dialog open={!!selectedAnnouncement && !viewModalOpen} onOpenChange={() => setSelectedAnnouncement(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAnnouncement?.title}
                <Badge 
                  variant="secondary" 
                  className={`${selectedAnnouncement?.status && statusColors[selectedAnnouncement.status].bg} ${selectedAnnouncement?.status && statusColors[selectedAnnouncement.status].text}`}
                >
                  {selectedAnnouncement?.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Badge variant="outline">{selectedAnnouncement?.class}</Badge>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedAnnouncement?.date}
                    </div>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {selectedAnnouncement?.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    Created: {selectedAnnouncement?.createdAt}
                    {selectedAnnouncement?.updatedAt && (
                      <span className="ml-2">
                        · Updated: {selectedAnnouncement?.updatedAt}
                      </span>
                    )}
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {role === "admin" && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedAnnouncement(null)}>
                    Close
                  </Button>
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Announcement</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this announcement? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AnnouncementListPage;
