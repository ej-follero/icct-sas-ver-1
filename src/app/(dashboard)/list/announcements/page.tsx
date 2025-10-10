"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { announcementsData } from "@/lib/data";
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
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { CreateAnnouncementDialog } from '@/components/reusable/Dialogs/CreateAnnouncementDialog';
import { EditAnnouncementDialog } from '@/components/reusable/Dialogs/EditAnnouncementDialog';
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
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  Search, 
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle,
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type SortField = 'date' | 'title' | 'class' | 'status';
type SortOrder = 'asc' | 'desc';


const statusColors = {
  ACTIVE: { bg: "bg-green-100", text: "text-green-700", hover: "hover:bg-green-200" },
  INACTIVE: { bg: "bg-gray-100", text: "text-gray-700", hover: "hover:bg-gray-200" },
  // Legacy support for old values
  important: { bg: "bg-red-100", text: "text-red-700", hover: "hover:bg-red-200" },
  normal: { bg: "bg-blue-100", text: "text-blue-700", hover: "hover:bg-blue-200" },
  archived: { bg: "bg-gray-100", text: "text-gray-700", hover: "hover:bg-gray-200" },
};

const announcementSortFieldOptions = [
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
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{start: string, end: string}>({start: '', end: ''});
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
  const [createAnnouncementDialogOpen, setCreateAnnouncementDialogOpen] = useState(false);
  const [editAnnouncementDialogOpen, setEditAnnouncementDialogOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sortBy: sortField,
        sortOrder: sortOrder,
        search: searchValue,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(classFilter !== 'all' && { class: classFilter }),
        ...(dateRangeFilter.start && { startDate: dateRangeFilter.start }),
        ...(dateRangeFilter.end && { endDate: dateRangeFilter.end }),
      });

      const response = await fetch(`/api/announcements?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      // Transform the data to match the Announcement type
      const transformedAnnouncements = (data.items || []).map((item: any) => ({
        ...item,
        status: item.status as AnnouncementStatus
      }));
      setAnnouncements(transformedAnnouncements);
      setTotalAnnouncements(data.total || 0);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements. Please try again.');
      setAnnouncements([]);
      setTotalAnnouncements(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, itemsPerPage, sortField, sortOrder, searchValue, statusFilter, priorityFilter, classFilter, dateRangeFilter]);

  // Add Fuse.js setup for fuzzy search using real data
  const fuse = useMemo(() => new Fuse(announcements, {
    keys: ["title", "description", "class"],
    threshold: 0.4,
    includeMatches: true,
  }), [announcements]);

  const fuzzyResults = useMemo(() => {
    if (!searchValue) return announcements.map((a, i: number) => ({ item: a, refIndex: i }));
    return fuse.search(searchValue);
  }, [searchValue, fuse, announcements]);

  // Enhanced filtering logic
  const filteredAnnouncements = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

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
  }, [fuzzyResults, statusFilter, classFilter, sortField, sortOrder]);

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
      await fetchAnnouncements();
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
          // Delete multiple announcements
          const deletePromises = selectedItems.map(id => 
            fetch(`/api/announcements/${id}`, { method: 'DELETE' })
          );
          await Promise.all(deletePromises);
          toast.success(`Successfully deleted ${selectedItems.length} announcements`);
          break;
          
        case 'archive':
          // Archive multiple announcements
          const archivePromises = selectedItems.map(id => 
            fetch(`/api/announcements/${id}`, { 
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'archived' })
            })
          );
          await Promise.all(archivePromises);
          toast.success(`Successfully archived ${selectedItems.length} announcements`);
          break;
          
        case 'status-update':
          // Update status of multiple announcements
          const statusUpdatePromises = selectedItems.map(id => 
            fetch(`/api/announcements/${id}`, { 
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'important' })
            })
          );
          await Promise.all(statusUpdatePromises);
          toast.success(`Successfully updated status for ${selectedItems.length} announcements`);
          break;
          
        case 'notification':
          // Send real notifications via email
          try {
            const notificationPromises = selectedItems.map(async (id) => {
              const announcement = announcements.find(a => a.id.toString() === id);
              if (announcement) {
                const response = await fetch('/api/announcements/notify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    announcementId: id,
                    title: announcement.title,
                    content: announcement.description 
                  })
                });
                return response.ok;
              }
              return false;
            });
            
            const results = await Promise.all(notificationPromises);
            const successCount = results.filter(Boolean).length;
            
            if (successCount > 0) {
              toast.success(`Notifications sent for ${successCount} out of ${selectedItems.length} announcements`);
            } else {
              toast.error('Failed to send notifications. Please check email configuration.');
            }
          } catch (error) {
            console.error('Notification sending failed:', error);
            toast.error('Failed to send notifications. Please try again.');
          }
          break;
          
        case 'export':
          // Export selected announcements
          const selectedAnnouncements = announcements.filter(announcement => selectedItems.includes(announcement.id.toString()));
          const exportData = selectedAnnouncements.map(announcement => ({
            title: announcement.title,
            class: announcement.class,
            date: announcement.date,
            status: announcement.status,
            description: announcement.description
          }));
          
          const csvContent = [
            Object.keys(exportData[0]).join(','),
            ...exportData.map(row => Object.values(row).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `announcements-export-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          
          toast.success(`Exported ${selectedItems.length} announcements`);
          break;
          
        default:
          toast.error('Unknown bulk action');
      }
      
      // Refresh the announcements list
      fetchAnnouncements();
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
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      toast.success('Announcement deleted successfully');
      fetchAnnouncements(); // Refresh the list
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setIsDeleting(false);
    setDeleteConfirm(null);
    }
  };

  const handleCreateAnnouncement = async (announcementData: any) => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData),
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      toast.success('Announcement created successfully');
      fetchAnnouncements(); // Refresh the list
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const handleUpdateAnnouncement = async (announcementData: any) => {
    if (!selectedAnnouncement) return;

    try {
      const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementData),
      });

      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }

      toast.success('Announcement updated successfully');
      fetchAnnouncements(); // Refresh the list
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditAnnouncementDialogOpen(true);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>ICCT Smart Attendance System - Announcements Report</title>
            <meta charset="UTF-8">
            <style>
              @page {
                margin: 0.5in;
                size: A4;
              }
              
              * {
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                color: #333;
                line-height: 1.6;
                background: white;
              }
              
              .print-container {
                max-width: 100%;
                margin: 0 auto;
                padding: 20px;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #1e40af;
              }
              
              .logo-section {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 15px;
              }
              
              .logo-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                color: white;
                font-weight: bold;
                font-size: 18px;
              }
              
              .system-title {
                font-size: 24px;
                font-weight: bold;
                color: #1e40af;
                margin: 0;
              }
              
              .report-title {
                font-size: 28px;
                font-weight: bold;
                color: #1e40af;
                margin: 15px 0 10px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .report-subtitle {
                font-size: 16px;
                color: #6b7280;
                margin: 0 0 20px 0;
              }
              
              .report-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8fafc;
                padding: 15px 20px;
                border-radius: 8px;
                margin-bottom: 25px;
                border-left: 4px solid #1e40af;
              }
              
              .info-item {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              
              .info-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }
              
              .info-value {
                font-size: 16px;
                font-weight: bold;
                color: #1e40af;
              }
              
              .table-container {
                overflow: visible;
                margin-bottom: 20px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 0;
                background: white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              
              thead {
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                color: white;
              }
              
              th {
                padding: 15px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: none;
              }
              
              th:first-child {
                border-top-left-radius: 8px;
              }
              
              th:last-child {
                border-top-right-radius: 8px;
              }
              
              tbody tr {
                border-bottom: 1px solid #e5e7eb;
                transition: background-color 0.2s;
              }
              
              tbody tr:nth-child(even) {
                background-color: #f9fafb;
              }
              
              tbody tr:hover {
                background-color: #f3f4f6;
              }
              
              tbody tr:last-child {
                border-bottom: none;
              }
              
              td {
                padding: 12px;
                font-size: 13px;
                vertical-align: top;
                border: none;
              }
              
              .title-cell {
                font-weight: 600;
                color: #1e40af;
                max-width: 200px;
              }
              
              .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .status-active {
                background-color: #dcfce7;
                color: #166534;
              }
              
              .status-inactive {
                background-color: #f3f4f6;
                color: #374151;
              }
              
              .status-important {
                background-color: #fef2f2;
                color: #dc2626;
              }
              
              .status-normal {
                background-color: #eff6ff;
                color: #1d4ed8;
              }
              
              .status-archived {
                background-color: #f9fafb;
                color: #6b7280;
              }
              
              .description-cell {
                max-width: 250px;
                word-wrap: break-word;
                line-height: 1.4;
              }
              
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
              }
              
              .footer-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
              }
              
              .page-info {
                font-weight: 600;
                color: #1e40af;
              }
              
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                
                .print-container {
                  padding: 0;
                }
                
                .table-container {
                  page-break-inside: avoid;
                }
                
                tbody tr {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="header">
                <div class="logo-section">
                  <div class="logo-icon">ICCT</div>
                  <h1 class="system-title">ICCT Smart Attendance System</h1>
                </div>
                <h2 class="report-title">Announcements Report</h2>
                <p class="report-subtitle">Comprehensive list of all system announcements</p>
              </div>
              
              <div class="report-info">
                <div class="info-item">
                  <span class="info-label">Generated On</span>
                  <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Announcements</span>
                  <span class="info-value">${totalAnnouncements}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Active Announcements</span>
                  <span class="info-value">${announcements.filter(a => a.status === 'important' || a.status === 'normal').length}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Report Type</span>
                  <span class="info-value">Complete List</span>
                </div>
              </div>
              
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style="width: 25%;">Title</th>
                      <th style="width: 15%;">Class</th>
                      <th style="width: 12%;">Date</th>
                      <th style="width: 10%;">Status</th>
                      <th style="width: 38%;">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${announcements.map(announcement => `
                      <tr>
                        <td class="title-cell">${announcement.title}</td>
                        <td>${announcement.class}</td>
                        <td>${announcement.date}</td>
                        <td>
                          <span class="status-badge status-${announcement.status.toLowerCase()}">
                            ${announcement.status}
                          </span>
                        </td>
                        <td class="description-cell">${announcement.description || 'No description provided'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="footer">
                <div class="footer-info">
                  <span class="page-info">ICCT Smart Attendance System</span>
                  <span>Generated on ${formattedDate}</span>
                </div>
                <p>This report contains confidential information and is intended for authorized personnel only.</p>
              </div>
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
    totalAnnouncements: totalAnnouncements,
    important: announcements.filter(a => a.status === 'important').length,
    normal: announcements.filter(a => a.status === 'normal').length,
    archived: announcements.filter(a => a.status === 'archived').length,
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
            icon={<AlertCircle className="text-blue-500 w-5 h-5" />}
            label="Important"
            value={stats.important}
            valueClassName="text-blue-900"
            sublabel="High priority announcements"
          />
          <SummaryCard
            icon={<CheckCircle className="text-blue-500 w-5 h-5" />}
            label="Normal"
            value={stats.normal}
            valueClassName="text-blue-900"
            sublabel="Regular announcements"
          />
          <SummaryCard
            icon={<XCircle className="text-blue-500 w-5 h-5" />}
            label="Archived"
            value={stats.archived}
            valueClassName="text-blue-900"
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
                onClick: () => setCreateAnnouncementDialogOpen(true)
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
                onClick: handlePrint
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
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center gap-2 justify-end">
                {/* Search Bar */}
                <div className="relative w-160">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search announcements..."
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
                    {Array.from(new Set(announcements.map(a => a.class))).map(class_name => (
                      <SelectItem key={class_name} value={class_name}>{class_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AnnouncementStatus | "all")}>
                  <SelectTrigger className="w-32 border-gray-300 rounded text-gray-600 focus:border-gray-400 focus:ring-0">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</label>
                        <Input
                          type="date"
                          value={dateRangeFilter.start}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setDateRangeFilter(prev => ({ ...prev, start: e.target.value }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">End Date</label>
                        <Input
                          type="date"
                          value={dateRangeFilter.end}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setDateRangeFilter(prev => ({ ...prev, end: e.target.value }))
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRangeFilter({ start: '', end: '' })}
                          className="flex-1"
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Close dropdown after setting dates
                            const trigger = document.querySelector('[data-radix-collection-item]');
                            if (trigger) {
                              (trigger as HTMLElement).click();
                            }
                          }}
                          className="flex-1"
                        >
                          Apply
                        </Button>
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
                              <Badge className={`text-xs ${statusColors[item.status as keyof typeof statusColors]?.bg || 'bg-gray-100'} ${statusColors[item.status as keyof typeof statusColors]?.text || 'text-gray-700'}`}>
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{item.class}</span>
                              <span>{item.date}</span>
                              {item.description && (
                                <span className="line-clamp-1 max-w-xs">
                                  {item.description}
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit announcement"
                                    className="hover:bg-green-50"
                                    onClick={() => handleEditAnnouncement(item)}
                                  >
                                    <Edit className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="bg-green-900 text-white">
                                  Edit announcement
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete announcement"
                                    className="hover:bg-red-50"
                                    onClick={() => setDeleteConfirm(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="bg-red-900 text-white">
                                  Delete announcement
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
          onOpenChange={(open) => {
            setViewModalOpen(open);
            if (!open) setSelectedAnnouncement(null);
          }}
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
          entityType="announcement"
          entityLabel="announcement"
          availableActions={[
            { id: 'status-update', label: 'Update Status', description: 'Update status of selected announcements', icon: <Settings className="w-4 h-4" />, tabId: 'status-update' },
            { id: 'notification', label: 'Send Notification', description: 'Send notification to recipients', icon: <Bell className="w-4 h-4" />, tabId: 'notification' },
            { id: 'export', label: 'Export Data', description: 'Export selected announcements data', icon: <Download className="w-4 h-4" />, tabId: 'export' },
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
          getItemId={item => item.id.toString()}
        />


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

        {/* Create Announcement Dialog */}
        <CreateAnnouncementDialog
          open={createAnnouncementDialogOpen}
          onOpenChange={setCreateAnnouncementDialogOpen}
          onAnnouncementCreated={handleCreateAnnouncement}
        />

        {/* Edit Announcement Dialog */}
        {selectedAnnouncement && editAnnouncementDialogOpen && (
          <EditAnnouncementDialog
            open={editAnnouncementDialogOpen}
            onOpenChange={(open) => {
              setEditAnnouncementDialogOpen(open);
              if (!open) setSelectedAnnouncement(null);
            }}
            announcement={selectedAnnouncement}
            onAnnouncementUpdated={handleUpdateAnnouncement}
          />
        )}

        {/* Export Dialog */}
        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          dataCount={paginatedAnnouncements.filter(item => selectedItems.includes(item.id.toString())).length}
          entityType="announcement"
          onExport={async (format) => {
            toast.success(`Export started: ${format.toUpperCase()}`);
          }}
        />

        {/* Sort Dialog */}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortOptions={[
            { value: 'title', label: 'Title' },
            { value: 'class', label: 'Class' },
            { value: 'date', label: 'Date' },
            { value: 'status', label: 'Status' },
          ]}
          currentSort={{ field: sortField, order: sortOrder }}
          onSortChange={(field, order) => {
            setSortField(field as SortField);
            setSortOrder(order);
          }}
        />

        {/* Visible Columns Dialog */}
        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={[
            { accessor: 'title', header: 'Title', description: 'Announcement title' },
            { accessor: 'class', header: 'Class', description: 'Target class or section' },
            { accessor: 'date', header: 'Date', description: 'Announcement date' },
            { accessor: 'status', header: 'Status', description: 'Announcement status' },
            { accessor: 'description', header: 'Description', description: 'Announcement content' },
            { accessor: 'priority', header: 'Priority', description: 'Priority level' },
            { accessor: 'createdBy', header: 'Created By', description: 'Creator name' },
            { accessor: 'createdAt', header: 'Created At', description: 'Creation timestamp' },
            { accessor: 'updatedAt', header: 'Updated At', description: 'Last update timestamp' },
          ]}
          visibleColumns={visibleColumns}
          onColumnToggle={(columnAccessor, checked) => {
            if (checked) {
              setVisibleColumns(prev => [...prev, columnAccessor]);
            } else {
              setVisibleColumns(prev => prev.filter(col => col !== columnAccessor));
            }
          }}
          onSelectAll={() => setVisibleColumns(['title', 'class', 'date', 'status', 'description', 'priority', 'createdBy', 'createdAt', 'updatedAt'])}
          onSelectNone={() => setVisibleColumns([])}
          onReset={() => setVisibleColumns(['title', 'class', 'date', 'status'])}
        />

        {/* Import Dialog */}
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          entityName="announcements"
          onImport={async (data: any[]) => {
            try {
              let successCount = 0;
              let failedCount = 0;
              const errors: string[] = [];

              for (const record of data) {
                try {
                  const response = await fetch('/api/announcements', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      title: record.title,
                      description: record.description || record.content,
                      class: record.class,
                      status: record.status || 'normal',
                      priority: record.priority || 'normal',
                    }),
                  });

                  if (response.ok) {
                    successCount++;
                  } else {
                    failedCount++;
                    errors.push(`Failed to import: ${record.title}`);
                  }
                } catch (error) {
                  failedCount++;
                  errors.push(`Error importing ${record.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }

              if (successCount > 0) {
                toast.success(`Successfully imported ${successCount} announcements`);
                fetchAnnouncements(); // Refresh the list
              }

              return { success: successCount, failed: failedCount, errors };
            } catch (error) {
              console.error('Import error:', error);
              toast.error('Failed to import announcements');
              return { success: 0, failed: data.length, errors: ['Import failed'] };
            }
          }}
        />
      </div>
    </div>
  );
};

export default AnnouncementListPage;
