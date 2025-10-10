'use client';

import { useState, useCallback, useMemo, useEffect } from "react";
import { eventsData } from "@/lib/data";
import { Plus, Trash2, Search, AlertCircle, Calendar, CheckCircle, XCircle, Settings, Download, RefreshCw, Printer, Upload, List, Columns3, Eye, TrendingUp, FileText, Clock, Info, Hash, Tag, Layers, X, Loader2, Bell, Edit, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/reusable";
import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { CreateEventDialog } from '@/components/reusable/Dialogs/CreateEventDialog';
import { EditEventDialog } from '@/components/reusable/Dialogs/EditEventDialog';
import { ImportDialog } from '@/components/reusable/Dialogs/ImportDialog';
import Fuse from "fuse.js";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
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
  description?: string;
  location?: string;
  status?: string;
  priority?: string;
  eventType?: string;
  capacity?: number;
  registeredCount?: number;
  isPublic?: boolean;
  requiresRegistration?: boolean;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  attendanceCount?: number;
};

type SortField = 'title' | 'class' | 'date' | 'startTime' | 'endTime';
type SortOrder = 'asc' | 'desc';


const eventSortFieldOptions = [
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
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{start: string, end: string}>({start: '', end: ''});
  const [tempDateRangeFilter, setTempDateRangeFilter] = useState<{start: string, end: string}>({start: '', end: ''});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'individual' | 'bulk';
    eventId?: number;
    eventTitle?: string;
  } | null>(null);

  // Fetch events from API
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(classFilter !== 'all' && { eventType: classFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(dateRangeFilter.start && { startDate: dateRangeFilter.start }),
        ...(dateRangeFilter.end && { endDate: dateRangeFilter.end }),
      });

      const response = await fetch(`/api/events?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to fetch events: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setEvents(data.items || []);
      setTotalEvents(data.total || 0);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
      // Fallback to mock data
      setEvents(eventsData);
      setTotalEvents(eventsData.length);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchEvents();
  }, [currentPage, itemsPerPage, sortField, sortOrder, classFilter, statusFilter, priorityFilter, dateRangeFilter]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to first page when search changes
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchValue, currentPage]);

  // Initialize temp date range filter when component mounts
  useEffect(() => {
    setTempDateRangeFilter(dateRangeFilter);
  }, []);

  // Add Fuse.js setup for fuzzy search using real data
  const fuse = useMemo(() => new Fuse(events, {
    keys: ["title", "class"],
    threshold: 0.4,
    includeMatches: true,
  }), [events]);

  const fuzzyResults = useMemo(() => {
    if (!searchValue) return events.map((a, i: number) => ({ item: a, refIndex: i }));
    return fuse.search(searchValue);
  }, [searchValue, fuse, events]);

  // Enhanced filtering logic
  const filteredEvents = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(item => item.class === classFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }

    // Apply date range filter
    if (dateRangeFilter.start || dateRangeFilter.end) {
      filtered = filtered.filter(item => {
        const eventDate = new Date(item.date);
        const startDate = dateRangeFilter.start ? new Date(dateRangeFilter.start) : null;
        const endDate = dateRangeFilter.end ? new Date(dateRangeFilter.end) : null;

        // Normalize dates to start of day for comparison
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
        const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;

        // Check if event date is within the range
        if (startDateOnly && endDateOnly) {
          return eventDateOnly >= startDateOnly && eventDateOnly <= endDateOnly;
        } else if (startDateOnly) {
          return eventDateOnly >= startDateOnly;
        } else if (endDateOnly) {
          return eventDateOnly <= endDateOnly;
        }
        return true;
      });
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
  }, [fuzzyResults, classFilter, statusFilter, priorityFilter, dateRangeFilter, sortField, sortOrder]);

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
    try {
      await fetchEvents();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDateFilterApply = () => {
    setDateRangeFilter(tempDateRangeFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleDateFilterClear = () => {
    setTempDateRangeFilter({ start: '', end: '' });
    setDateRangeFilter({ start: '', end: '' });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleBulkAction = async (action: 'delete' | 'status-update' | 'notification' | 'export') => {
    if (selectedItems.length === 0) return;
    
    setIsLoading(true);
    try {
      switch (action) {
        case 'delete':
          // Show bulk delete confirmation dialog
          setDeleteConfirm({
            type: 'bulk',
            eventTitle: `${selectedItems.length} selected events`
          });
          break;
          
        case 'status-update':
          // Update status of multiple events
          const statusUpdatePromises = selectedItems.map(id => 
            fetch(`/api/events/${id}`, { 
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'COMPLETED' })
            })
          );
          await Promise.all(statusUpdatePromises);
          toast.success(`Successfully updated status for ${selectedItems.length} events`);
          break;
          
        case 'notification':
          // Send notifications (simulated)
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success(`Notifications sent to ${selectedItems.length} events`);
          break;
          
        case 'export':
          // Open export dialog for selected events
          setExportDialogOpen(true);
          break;
          
        default:
          toast.error('Unknown bulk action');
      }
      
      // Refresh the events list
      fetchEvents();
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success('Event deleted successfully');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      // Soft delete multiple events
      const deletePromises = selectedItems.map(id => 
        fetch(`/api/events/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedItems.length} events`);
      
      // Refresh the events list and clear selection
      fetchEvents();
      setSelectedItems([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete events');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      toast.success('Event created successfully');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      toast.success('Event updated successfully');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEditEventDialogOpen(true);
  };

  const handleImportEvents = async (data: any[]) => {
    try {
      const response = await fetch('/api/events/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to import events');
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.success} events`);
      
      // Refresh the events list
      fetchEvents();
      
      return result;
    } catch (error) {
      console.error('Error importing events:', error);
      toast.error('Failed to import events');
      throw error;
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = currentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const printContent = `
        <html>
          <head>
            <title>Events Report - ${formattedDate}</title>
            <style>
              @page {
                margin: 0.5in;
                size: A4;
              }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; 
                padding: 20px;
                color: #333;
                line-height: 1.4;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px;
                border-bottom: 2px solid #1e40af;
                padding-bottom: 20px;
              }
              .header h1 { 
                color: #1e40af; 
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 600;
              }
              .header .subtitle {
                color: #6b7280;
                font-size: 14px;
                margin: 5px 0;
              }
              .report-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 25px;
                padding: 15px;
                background-color: #f8fafc;
                border-radius: 8px;
                border-left: 4px solid #1e40af;
              }
              .report-info div {
                text-align: center;
              }
              .report-info .label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
              }
              .report-info .value {
                font-size: 18px;
                font-weight: 600;
                color: #1e40af;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              th { 
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              td { 
                padding: 10px 8px; 
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              tr:hover {
                background-color: #f3f4f6;
              }
              .status {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .status-draft { background-color: #fef3c7; color: #92400e; }
              .status-scheduled { background-color: #dbeafe; color: #1e40af; }
              .status-ongoing { background-color: #d1fae5; color: #065f46; }
              .status-completed { background-color: #d1fae5; color: #065f46; }
              .status-cancelled { background-color: #fee2e2; color: #991b1b; }
              .status-postponed { background-color: #fef3c7; color: #92400e; }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
                padding-top: 15px;
              }
              @media print {
                body { margin: 0; }
                .header { page-break-inside: avoid; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Events Report</h1>
              <div class="subtitle">ICCT Smart Attendance System</div>
              <div class="subtitle">Generated on ${formattedDate} at ${formattedTime}</div>
            </div>
            
            <div class="report-info">
              <div>
                <div class="label">Total Events</div>
                <div class="value">${totalEvents}</div>
              </div>
              <div>
                <div class="label">Upcoming</div>
                <div class="value">${events.filter(e => new Date(e.date) > new Date()).length}</div>
              </div>
              <div>
                <div class="label">Today</div>
                <div class="value">${events.filter(e => {
                  const eventDate = new Date(e.date);
                  const today = new Date();
                  return eventDate.toDateString() === today.toDateString();
                }).length}</div>
              </div>
              <div>
                <div class="label">Completed</div>
                <div class="value">${events.filter(e => new Date(e.date) < new Date()).length}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(event => `
                  <tr>
                    <td><strong>${event.title}</strong></td>
                    <td>${event.class}</td>
                    <td>${new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</td>
                    <td>${event.startTime} - ${event.endTime}</td>
                    <td>${event.location || 'TBD'}</td>
                    <td><span class="status status-${(event.status || 'draft').toLowerCase()}">${event.status || 'Draft'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>This report was generated automatically by the ICCT Smart Attendance System</p>
              <p>For questions or support, please contact the system administrator</p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
    setIsPrinting(false);
  };


  const stats = {
    totalEvents: totalEvents,
    upcoming: events.filter(e => new Date(e.date) > new Date()).length,
    today: events.filter(e => {
      const eventDate = new Date(e.date);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }).length,
    past: events.filter(e => new Date(e.date) < new Date()).length,
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded flex-1 m-4 mt-0 space-y-4 animate-fade-in">
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
            icon={<TrendingUp className="text-blue-500 w-5 h-5" />}
            label="Upcoming"
            value={stats.upcoming}
            valueClassName="text-blue-900"
            sublabel="Future events"
          />
          <SummaryCard
            icon={<Clock className="text-blue-500 w-5 h-5" />}
            label="Today"
            value={stats.today}
            valueClassName="text-blue-900"
            sublabel="Events today"
          />
          <SummaryCard
            icon={<CheckCircle className="text-blue-500 w-5 h-5" />}
            label="Past"
            value={stats.past}
            valueClassName="text-blue-900"
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
                onClick: () => setCreateEventDialogOpen(true)
              },
              {
                id: 'export-events',
                label: 'Export Data',
                description: 'Export events to file',
                icon: <Download className="w-5 h-5 text-white" />,
                onClick: () => setExportDialogOpen(true)
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
                onClick: handlePrint
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
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center gap-2 justify-end">
                {/* Search Bar */}
                <div className="relative w-160">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                  />
                </div>
                
                {/* Filter Dropdowns */}
                <Select value={classFilter} onValueChange={(value) => setClassFilter(value)}>
                  <SelectTrigger className="w-32 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {Array.from(new Set(eventsData.map(e => e.class))).map(class_name => (
                      <SelectItem key={class_name} value={class_name}>{class_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                  <SelectTrigger className="w-28 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="POSTPONED">Postponed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value)}>
                  <SelectTrigger className="w-28 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-32 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0 ${
                        dateRangeFilter.start || dateRangeFilter.end ? 'border-blue-300 bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Date Filter
                      {(dateRangeFilter.start || dateRangeFilter.end) && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 rounded">
                          {dateRangeFilter.start && dateRangeFilter.end ? 'Range' : 'Set'}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900">Filter by Date Range</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Start Date
                          </label>
                          <Input
                            type="date"
                            value={tempDateRangeFilter.start}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const startDate = e.target.value;
                              const endDate = tempDateRangeFilter.end;
                              
                              // Validate that start date is not after end date
                              if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                                toast.error("Start date cannot be after end date");
                                return;
                              }
                              
                              setTempDateRangeFilter(prev => ({ ...prev, start: startDate }));
                            }}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            End Date
                          </label>
                          <Input
                            type="date"
                            value={tempDateRangeFilter.end}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const endDate = e.target.value;
                              const startDate = tempDateRangeFilter.start;
                              
                              // Validate that end date is not before start date
                              if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
                                toast.error("End date cannot be before start date");
                                return;
                              }
                              
                              setTempDateRangeFilter(prev => ({ ...prev, end: endDate }));
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDateFilterClear}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Clear
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTempDateRangeFilter(dateRangeFilter)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleDateFilterApply}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          OK
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        {dateRangeFilter.start || dateRangeFilter.end ? (
                          <span>
                            Current: {dateRangeFilter.start && dateRangeFilter.end 
                              ? `${new Date(dateRangeFilter.start).toLocaleDateString()} - ${new Date(dateRangeFilter.end).toLocaleDateString()}`
                              : dateRangeFilter.start 
                                ? `From ${new Date(dateRangeFilter.start).toLocaleDateString()}`
                                : `Until ${new Date(dateRangeFilter.end).toLocaleDateString()}`
                            }
                          </span>
                        ) : (
                          'No date filter applied'
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.location}
                                </span>
                              )}
                              {item.capacity && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {item.registeredCount || 0}/{item.capacity}
                                </span>
                              )}
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit event"
                                    className="hover:bg-green-50"
                                    onClick={() => handleEditEvent(item)}
                                  >
                                    <Edit className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="bg-green-900 text-white">
                                  Edit event
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete event"
                                    className="hover:bg-red-50"
                                    onClick={() => setDeleteConfirm({
                                      type: 'individual',
                                      eventId: item.id,
                                      eventTitle: item.title
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="bg-red-900 text-white">
                                  Delete event
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


        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={paginatedEvents.filter(item => selectedItems.includes(item.id.toString()))}
          entityType="event"
          entityLabel="event"
          availableActions={[
            { id: 'status-update', label: 'Update Status', description: 'Update status of selected events', icon: <Settings className="w-4 h-4" />, tabId: 'status-update' },
            { id: 'notification', label: 'Send Notification', description: 'Send notification to participants', icon: <Bell className="w-4 h-4" />, tabId: 'notification' },
            { id: 'export', label: 'Export Data', description: 'Export selected events data', icon: <Download className="w-4 h-4" />, tabId: 'export' },
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
          getItemStatus={item => 'active'}
          getItemId={item => item.id.toString()}
        />

        {/* Unified Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={!!deleteConfirm}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(null);
          }}
          itemName={deleteConfirm?.eventTitle}
          onDelete={() => {
            if (deleteConfirm) {
              if (deleteConfirm.type === 'individual' && deleteConfirm.eventId) {
                handleDelete(deleteConfirm.eventId);
              } else if (deleteConfirm.type === 'bulk') {
                handleBulkDelete();
              }
            }
          }}
          onCancel={() => setDeleteConfirm(null)}
          canDelete={true}
          deleteError={undefined}
          loading={isDeleting}
          description={
            deleteConfirm?.type === 'individual' 
              ? `Are you sure you want to delete this event? This action will mark the event as cancelled and hide it from the list, but the data will be preserved for recovery purposes.`
              : `Are you sure you want to delete ${selectedItems.length} selected events? This action will mark all selected events as cancelled and hide them from the list, but the data will be preserved for recovery purposes.`
          }
          dangerText={deleteConfirm?.type === 'individual' ? "Delete Event" : "Delete Events"}
          warningMessage={
            deleteConfirm?.type === 'individual'
              ? "This event will be marked as cancelled and hidden from the list. The data will be preserved for potential recovery."
              : `All ${selectedItems.length} selected events will be marked as cancelled and hidden from the list. The data will be preserved for potential recovery.`
          }
          affectedItems={deleteConfirm?.type === 'bulk' ? selectedItems.length : undefined}
          affectedItemType={deleteConfirm?.type === 'individual' ? "attendance records" : "events"}
        />

        {/* Create Event Dialog */}
        <CreateEventDialog
          open={createEventDialogOpen}
          onOpenChange={setCreateEventDialogOpen}
          onEventCreated={handleCreateEvent}
        />

        {/* Edit Event Dialog */}
        {selectedEvent && (
          <EditEventDialog
            open={editEventDialogOpen}
            onOpenChange={setEditEventDialogOpen}
            event={{
              id: selectedEvent.id,
              title: selectedEvent.title,
              description: selectedEvent.description || '',
              eventType: selectedEvent.class,
              eventDate: selectedEvent.date,
              endDate: selectedEvent.endTime,
              location: selectedEvent.location,
              capacity: selectedEvent.capacity,
              isPublic: selectedEvent.isPublic ?? true,
              requiresRegistration: selectedEvent.requiresRegistration ?? false,
              priority: selectedEvent.priority || 'NORMAL',
              status: selectedEvent.status || 'DRAFT',
              imageUrl: selectedEvent.imageUrl,
              contactEmail: selectedEvent.contactEmail,
              contactPhone: selectedEvent.contactPhone,
            }}
            onEventUpdated={handleUpdateEvent}
          />
        )}

        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          dataCount={selectedItems.length > 0 ? selectedItems.length : filteredEvents.length}
          entityType="event"
          onExport={async (format, options) => {
            console.log('Export format:', format, 'Export options:', options);
            const exportCount = selectedItems.length > 0 ? selectedItems.length : filteredEvents.length;
            toast.success(`Export completed! ${exportCount} events exported successfully.`);
          }}
        />

        {/* Sort Dialog */}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortOptions={eventSortFieldOptions}
          currentSort={{ field: sortField, order: sortOrder }}
          onSortChange={(field, order) => {
            setSortField(field as SortField);
            setSortOrder(order);
          }}
        />

        {/* Import Dialog */}
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImportEvents}
          entityName="events"
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={5}
        />
      </div>
    </div>
  );
};

export default EventListPage;
