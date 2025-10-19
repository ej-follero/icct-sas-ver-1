"use client";

import { useState, useEffect, useMemo } from "react";
import { PageSkeleton } from "@/components/reusable/Skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/reusable/Table/TablePagination";
import { UserForm } from "@/components/forms/UserForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import Fuse from "fuse.js";
import React from "react";
import { Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, UserCheck, UserX, Users, UserPlus, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, Hash, Tag, Layers, FileText, Clock, Info, UserCheck as UserCheckIcon, Archive, Shield, Mail, Phone, Key, Calendar, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { ImportDialog } from "@/components/reusable/Dialogs/ImportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportDialog } from '@/components/reusable/Dialogs/ExportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { PrintLayout } from '@/components/PrintLayout';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import { TableRowActions } from '@/components/reusable/Table/TableRowActions';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableExpandedRow } from '@/components/reusable/Table/TableExpandedRow';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import PageHeader from '@/components/PageHeader/PageHeader';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardHeader } from "@/components/ui/card";
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { SummaryCardSkeleton } from '@/components/reusable/Skeleton';
import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Checkbox as SharedCheckbox } from '@/components/ui/checkbox';
import { Pagination } from "@/components/Pagination";
import { TableHeaderSection } from '@/components/reusable/Table/TableHeaderSection';
import { useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, UserStatus, SortField, SortOrder, UserSortField, UserSortOrder } from '@/types/users-list';
import { safeHighlight } from "@/lib/sanitizer";
const ITEMS_PER_PAGE = 10;

interface ColumnFilter {
  field: string;
  value: string;
}

type MultiSortField = { field: SortField; order: SortOrder };

type FuseResultMatch = {
  key: string;
  indices: readonly [number, number][];
};

interface FuseResult<T> {
  item: T;
  refIndex: number;
  matches?: Array<{
    key: string;
    indices: readonly [number, number][];
  }>;
}

const userSortFieldOptions = [
  { value: 'userName', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' },
  { value: 'fullName', label: 'Full Name' },
  { value: 'studentIdNum', label: 'Student ID' },
  { value: 'createdAt', label: 'Created Date' },
];



// Centralized user columns definition
const userColumns = [
  { key: 'userName', label: 'Username', accessor: 'userName', className: 'text-blue-900 w-20', sortable: true },
  { key: 'email', label: 'Email', accessor: 'email', className: 'text-blue-900 w-24', sortable: true },
  { key: 'fullName', label: 'Full Name', accessor: 'fullName', className: 'text-blue-900 w-20', sortable: true },
  { key: 'studentIdNum', label: 'Student ID', accessor: 'studentIdNum', className: 'text-blue-900 w-20', sortable: true },
  { key: 'role', label: 'Role', accessor: 'role', className: 'text-center text-blue-900 w-16', sortable: true },
  { key: 'status', label: 'Status', accessor: 'status', className: 'text-center w-16', sortable: true },
  { key: 'lastLogin', label: 'Last Login', accessor: 'lastLogin', className: 'text-center text-blue-900 w-20', sortable: true },
];

// Use accessor/label for TableHeaderSection compatibility
const exportableColumns: { accessor: string; label: string }[] = userColumns.map((col) => ({ accessor: col.key, label: col.label }));
// For export dialogs, use the old { key, label } version
const exportableColumnsForExport: { key: string; label: string }[] = userColumns.map((col) => ({ key: col.key, label: col.label }));

// Define column options for visible columns dialog
const COLUMN_OPTIONS: ColumnOption[] = userColumns.map(col => ({
  accessor: typeof col.accessor === 'string' ? col.accessor : col.key,
  header: col.label,
  description: col.key === 'studentIdNum' ? 'Student identification number' : undefined,
  category: col.key === 'studentIdNum' ? 'Student Info' : 'User Info',
  required: col.key === 'userName' || col.key === 'email', // Always show username and email
}));

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [twoFactorFilter, setTwoFactorFilter] = useState('all');
  const [loginActivityFilter, setLoginActivityFilter] = useState('all');
  
  // Debounced search input for better performance
  const debouncedSearchInput = useDebounce(searchInput, 300);
  const [sortField, setSortField] = useState<UserSortField>('userName');
  const [sortOrder, setSortOrder] = useState<UserSortOrder>('asc');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);
  const [sortFields, setSortFields] = useState<MultiSortField[]>([
    { field: 'userName', order: 'asc' }
  ]);
  const [advancedFilters, setAdvancedFilters] = useState({
    role: '',
    minFailedAttempts: '',
    maxFailedAttempts: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(userColumns.map(col => col.key));
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [selectedUsersForBulkAction, setSelectedUsersForBulkAction] = useState<User[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<User | undefined>();
  const [viewUser, setViewUser] = useState<User | undefined>();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isBulkDeactivating, setIsBulkDeactivating] = useState(false);
  const [isBulkReactivating, setIsBulkReactivating] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleteData, setBulkDeleteData] = useState<{
    users: User[];
    excludedUsers: User[];
    message: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // Normalize object for Select components: replace empty strings/null with undefined
  const normalizeForSelect = <T extends Record<string, any>>(obj: T): T => {
    if (!obj || typeof obj !== 'object') return obj;
    const next: Record<string, any> = Array.isArray(obj) ? [...obj] : { ...obj };
    for (const key of Object.keys(next)) {
      const val = next[key];
      if (val === '') {
        next[key] = undefined;
      } else if (val === null) {
        next[key] = undefined;
      }
    }
    return next as T;
  };

  const [bulkReactivateConfirmOpen, setBulkReactivateConfirmOpen] = useState(false);
  const [bulkReactivateData, setBulkReactivateData] = useState<{
    users: User[];
    excludedUsers: User[];
    message: string;
  } | null>(null);

  // Helper Functions
  const highlightMatch = (text: string, matches: readonly [number, number][] | undefined) => {
    if (!matches || matches.length === 0) return text;
    let result = '';
    let lastIndex = 0;
    matches.forEach(([start, end], i) => {
      result += text.slice(lastIndex, start);
      result += `<mark class='bg-yellow-200 text-yellow-900 rounded px-1 font-medium'>${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });
    result += text.slice(lastIndex);
    return result;
  };

  // Enhanced search highlighting with case-insensitive matching
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 rounded px-1 font-medium">$1</mark>');
  };

  // Add Fuse.js setup with proper types and improved configuration
  const fuse = useMemo(() => new Fuse<User>(users, {
    keys: [
      { name: "userName", weight: 0.25 },
      { name: "email", weight: 0.2 },
      { name: "fullName", weight: 0.15 },
      { name: "role", weight: 0.1 },
      { name: "relatedInfo.studentIdNum", weight: 0.2 }, // Student number
      { name: "relatedInfo.guardian.name", weight: 0.1 } // Guardian name
    ],
    threshold: 0.6, // More lenient threshold for better search results
    includeMatches: true,
    ignoreLocation: true, // Search anywhere in the string
    findAllMatches: true, // Find all matches, not just the first one
    minMatchCharLength: 1, // Allow single character matches
  }), [users]);

  const fuzzyResults = useMemo(() => {
    if (!debouncedSearchInput.trim()) {
      return users.map((u: User, i: number) => ({ item: u, refIndex: i }));
    }
    return fuse.search(debouncedSearchInput) as FuseResult<User>[];
  }, [debouncedSearchInput, fuse, users]);

  // Update filtered users to include column filters and status filter
  const filteredUsers = useMemo(() => {
    let filtered = fuzzyResults.map((r: FuseResult<User>) => r.item);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply verification filter
    if (verificationFilter !== "all") {
      filtered = filtered.filter(user => {
        if (verificationFilter === "email-verified") return user.isEmailVerified;
        if (verificationFilter === "not-verified") return !user.isEmailVerified;
        return true;
      });
    }

    // Apply two-factor auth filter
    if (twoFactorFilter !== "all") {
      filtered = filtered.filter(user => {
        if (twoFactorFilter === "enabled") return user.twoFactorEnabled;
        if (twoFactorFilter === "disabled") return !user.twoFactorEnabled;
        return true;
      });
    }

    // Apply login activity filter
    if (loginActivityFilter !== "all") {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(user => {
        if (!user.lastLogin) {
          return loginActivityFilter === "never-logged-in";
        }
        
        const lastLoginDate = new Date(user.lastLogin);
        
        if (loginActivityFilter === "recent") return lastLoginDate >= sevenDaysAgo;
        if (loginActivityFilter === "active") return lastLoginDate >= thirtyDaysAgo;
        if (loginActivityFilter === "inactive") return lastLoginDate < thirtyDaysAgo;
        if (loginActivityFilter === "never-logged-in") return !user.lastLogin;
        
        return true;
      });
    }

    // Apply column filters
    if (columnFilters.length > 0) {
      filtered = filtered.filter(user => {
        return columnFilters.every(filter => {
          const value = user[filter.field as keyof User]?.toString().toLowerCase() || '';
          return value.includes(filter.value.toLowerCase());
        });
      });
    }

    // Apply multi-sort
    if (sortFields.length > 0) {
      filtered.sort((a, b) => {
        for (const { field, order } of sortFields) {
          let aValue, bValue;
          
          if (field === 'studentIdNum') {
            aValue = a.relatedInfo?.studentIdNum || '';
            bValue = b.relatedInfo?.studentIdNum || '';
          } else {
            aValue = a[field as keyof User];
            bValue = b[field as keyof User];
          }
          
          if (aValue === bValue) continue;
          
          const comparison = (aValue || '') < (bValue || '') ? -1 : 1;
          return order === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  }, [fuzzyResults, columnFilters, statusFilter, roleFilter, verificationFilter, twoFactorFilter, loginActivityFilter, sortFields]);

  // Add pagination
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.includes(u.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedUsers.map(u => u.id));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Handler for toggling column visibility
  const handleColumnToggle = (columnAccessor: string, checked: boolean) => {
    setVisibleColumns(prev => {
      if (checked) {
        return prev.includes(columnAccessor) ? prev : [...prev, columnAccessor];
      } else {
        // Don't allow hiding required columns
        if (COLUMN_OPTIONS.find(col => col.accessor === columnAccessor)?.required) return prev;
        return prev.filter(col => col !== columnAccessor);
      }
    });
  };
  // Handler for resetting columns to default
  const handleResetColumns = () => {
    setVisibleColumns(userColumns.map(col => col.key));
    toast.success('Column visibility reset to default');
  };

  // Handle expandable row toggle
  const handleToggleExpand = (userId: string) => {
    setExpandedRowIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Table columns (filtered by visibleColumns)
  const columns: TableListColumn<User>[] = [
    {
      header: "",
      accessor: 'expander',
      className: 'w-8 text-center px-1 py-1',
      expandedContent: (item: User) => {
        // Prepare security and activity information
        const securityInfo = {
          emailVerified: item.isEmailVerified ? 'Verified' : 'Not Verified',
          twoFactorAuth: item.twoFactorEnabled ? 'Enabled' : 'Disabled',
          failedAttempts: item.failedLoginAttempts,
          lastPasswordChange: item.lastPasswordChange ? new Date(item.lastPasswordChange).toLocaleDateString() : 'Never'
        };

        const activityInfo = item.statistics ? {
          totalAttendance: item.statistics.totalAttendance,
          systemLogs: item.statistics.totalSystemLogs,
          reportLogs: item.statistics.totalReportLogs,
          rfidLogs: item.statistics.totalRFIDLogs
        } : null;

        

        return (
          <TableExpandedRow
            key={`expanded-${item.id}`}
            colSpan={userColumns.filter(col => visibleColumns.includes(col.key)).length + 3}
            headers={["Security Status", "Activity Statistics"]}
            rows={[
              {
                security: `${securityInfo.emailVerified} • 2FA: ${securityInfo.twoFactorAuth}`,
                activity: activityInfo ? `${activityInfo.totalAttendance} attendance • ${activityInfo.systemLogs} system logs • ${activityInfo.reportLogs} reports • ${activityInfo.rfidLogs} RFID logs` : 'No activity data available'
              }
            ]}
            renderRow={(row: any) => (
              <TableRow key={`row-${item.id}`} className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                <TableCell className="text-left align-top w-1/3 p-4">
                  <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 bg-blue-50 rounded p-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div className="text-sm font-semibold text-blue-900">Security Status</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">Email</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isEmailVerified 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {securityInfo.emailVerified}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">2FA</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.twoFactorEnabled 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {securityInfo.twoFactorAuth}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Failed attempts:</span>
                          <span className="font-medium">{securityInfo.failedAttempts}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <span>Last password change:</span>
                          <span className="font-medium">{securityInfo.lastPasswordChange}</span>
                        </div>
                        {item.role === 'SUPER_ADMIN' && (
                          <div className="flex items-center justify-between text-xs text-red-600 mt-2 pt-2 border-t border-red-100">
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span className="font-medium">SUPER_ADMIN Protection</span>
                            </div>
                            <span className="font-medium">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left align-top w-1/3 p-4">
                  <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 bg-green-50 rounded p-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <div className="text-sm font-semibold text-blue-900">Activity Statistics</div>
                    </div>
                    {activityInfo ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">Attendance</span>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            {activityInfo.totalAttendance}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">System Logs</span>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            {activityInfo.systemLogs}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">Reports</span>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                            {activityInfo.reportLogs}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Hash className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">RFID Logs</span>
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                            {activityInfo.rfidLogs}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <div className="text-xs text-gray-500">No activity data available</div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            emptyMessage="No additional details available."
          />
        );
      },
      render: (item: User) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
                className={`h-8 w-8 p-0 rounded-full transition-all duration-200 hover:bg-blue-50 hover:scale-110 ${
                  expandedRowIds.includes(item.id) 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-blue-600'
                }`}
          onClick={() => handleToggleExpand(item.id)}
        >
          {expandedRowIds.includes(item.id) ? (
                  <ChevronUp className="h-4 w-4" />
          ) : (
                  <ChevronDown className="h-4 w-4" />
          )}
        </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{expandedRowIds.includes(item.id) ? 'Collapse details' : 'Expand details'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      header: (
        <SharedCheckbox 
          checked={isAllSelected} 
          indeterminate={isIndeterminate} 
          onCheckedChange={handleSelectAll}
          aria-label="Select all users"
        />
      ),
      accessor: 'select',
      className: 'w-10 text-center',
    },
    ...userColumns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => {
        if (col.key === 'userName') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: User) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<User> | undefined;
              const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "userName")?.indices;
              const highlightedText = nameMatches 
                ? safeHighlight(item.userName, nameMatches)
                : highlightSearchTerm(item.userName, debouncedSearchInput);
              return (
                <div 
                  className="text-sm font-medium text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              );
            }
          };
        }
        if (col.key === 'email') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: User) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<User> | undefined;
              const emailMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "email")?.indices;
              const highlightedText = emailMatches 
                ? safeHighlight(item.email, emailMatches)
                : highlightSearchTerm(item.email, debouncedSearchInput);
              return (
                <div 
                  className="text-sm text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              );
            }
          };
        }
        if (col.key === 'fullName') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: User) => {
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<User> | undefined;
              const nameMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "fullName")?.indices;
              const highlightedText = nameMatches 
                ? safeHighlight(item.fullName, nameMatches)
                : highlightSearchTerm(item.fullName, debouncedSearchInput);
              return (
                <div 
                  className="text-sm text-blue-900 text-center"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              );
            }
          };
        }
        if (col.key === 'studentIdNum') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: User) => {
              const studentIdNum = item.relatedInfo?.studentIdNum || 'N/A';
              const fuseResult = fuzzyResults.find(r => r.item.id === item.id) as FuseResult<User> | undefined;
              const studentIdMatches = fuseResult?.matches?.find((m: { key: string }) => m.key === "relatedInfo.studentIdNum")?.indices;
              const highlightedText = studentIdMatches 
                ? safeHighlight(studentIdNum, studentIdMatches)
                : highlightSearchTerm(studentIdNum, debouncedSearchInput);
              return (
                <div 
                  className="text-sm text-blue-900 text-center font-mono"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
              );
            }
          };
        }
        if (col.key === 'role') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: User) => (
              <div className="flex flex-col gap-1 items-center">
                <Badge 
                  variant={item.role === 'SUPER_ADMIN' ? 'destructive' : 'outline'} 
                  className={`text-xs ${item.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 border-red-200' : ''}`}
                >
                  {item.role}
                </Badge>
                {item.role === 'SUPER_ADMIN' && (
                  <div className="text-xs text-red-600 font-medium">Protected</div>
                )}
              </div>
            )
          };
        }
        if (col.key === 'status') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: User) => (
              <Badge variant={item.status === "active" ? "success" : item.status === "inactive" ? "destructive" : item.status === "suspended" ? "secondary" : "warning"} className="text-center">
                {item.status.toUpperCase()}
              </Badge>
            )
          };
        }
        if (col.key === 'lastLogin') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: 'text-center',
            sortable: col.sortable,
            render: (item: User) => (
              <span className="text-sm text-blue-900 text-center">
                {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never'}
              </span>
            )
          };
        }
        return {
          header: col.label,
          accessor: col.accessor,
          className: 'text-center',
          sortable: col.sortable
        };
      }),
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      render: (item: User) => (
        <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View User"
                  className="hover:bg-blue-50"
                  onClick={() => {
                    setSelectedUser(item);
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
                  aria-label="Edit User"
                  className="hover:bg-green-50"
                  onClick={() => {
                    setSelectedUser(item);
                    setEditModalOpen(true);
                  }}
                  disabled={item.role === 'SUPER_ADMIN'}
                >
                  <Pencil className={`h-4 w-4 ${item.role === 'SUPER_ADMIN' ? 'text-gray-400' : 'text-green-600'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                {item.role === 'SUPER_ADMIN' ? 'Cannot edit SUPER_ADMIN' : 'Edit'}
              </TooltipContent>
            </Tooltip>
            {item.status === "inactive" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Restore User"
                    className="hover:bg-green-50"
                    onClick={() => handleRestore(item)}
                    disabled={restoringId === item.id}
                  >
                    {restoringId === item.id ? (
                      <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                    ) : (
                    <RotateCcw className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                  Restore user
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Deactivate User"
                      className="hover:bg-red-50"
                      onClick={() => handleDelete(item)}
                      disabled={item.role === 'SUPER_ADMIN'}
                    >
                      <Trash2 className={`h-4 w-4 ${item.role === 'SUPER_ADMIN' ? 'text-gray-400' : 'text-red-600'}`} />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                  {item.role === 'SUPER_ADMIN' ? 'Cannot deactivate SUPER_ADMIN' : 'Deactivate user'}
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )
    }
  ];

  // Handler for sorting columns
  const handleSort = (field: string) => {
    setSortField((prevField) => {
      const isSameField = prevField === field;
      const newOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder as UserSortOrder);
      setSortFields([{ field: field as UserSortField, order: newOrder as UserSortOrder }]);
      return field as UserSortField;
    });
  };

  // Fetch users
  const fetchUsers = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
        setError(null);
        if (refresh) toast.success('Users refreshed successfully');
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
      if (refresh) toast.error('Failed to refresh users. Please try again later.');
      else toast.error('Failed to load users. Please try again later.');
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search state
  useEffect(() => {
    if (searchInput !== debouncedSearchInput) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchInput, debouncedSearchInput]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search users"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (e.key === 'Escape' && searchInput) {
        setSearchInput('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchInput]);

  // Export to CSV handler
  const handleExport = async () => {
    if (!exportFormat) return;

    try {
      const selectedUsers = selectedIds.length > 0 
        ? users.filter(user => selectedIds.includes(user.id))
        : filteredUsers;

      const visibleColumns = userColumns.filter(col => exportColumns.includes(col.key));

      switch (exportFormat) {
        case 'pdf':
          await handleExportPDF(selectedUsers, visibleColumns);
          break;
        case 'excel':
          await handleExportExcel(selectedUsers, visibleColumns);
          break;
        case 'csv':
          handleExportCSV(selectedUsers, visibleColumns);
          break;
      }

      toast.success(`Users exported to ${exportFormat.toUpperCase()} successfully.`);
      setExportDialogOpen(false);
    } catch (error) {
      toast.error("Failed to export users. Please try again.");
    }
  };

  const handleExportPDF = async (users: User[], columns: typeof userColumns) => {
    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Users List', 14, 15);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 22);
    
    // Prepare table data with proper type handling
    const tableData = users.map(user => 
      columns.map(col => {
        const value = user[col.key as keyof User];
        if (col.key === 'status' && typeof value === 'string') {
          return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return value !== undefined ? String(value) : ''; // Handle undefined values
      })
    ) as string[][]; // Type assertion to match autoTable's expected type
    
    // Add table
    autoTable(doc, {
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Save the PDF
    doc.save('users-list.pdf');
  };

  const handleExportExcel = async (users: User[], columns: typeof userColumns) => {
    const XLSX = await import('xlsx');
    
    // Prepare data
    const data = users.map(user => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        const value = user[col.key as keyof User];
        if (col.key === 'status' && typeof value === 'string') {
          row[col.label] = value.charAt(0).toUpperCase() + value.slice(1);
        } else {
          row[col.label] = value;
        }
      });
      return row;
    });
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    
    // Save file
    XLSX.writeFile(wb, 'users-list.xlsx');
  };

  const handleExportCSV = (users: User[], columns: typeof userColumns) => {
    // Prepare headers
    const headers = columns.map(col => col.label);
    
    // Prepare data rows
    const rows = users.map(user => 
      columns.map(col => {
        const value = user[col.key as keyof User];
        if (col.key === 'status' && typeof value === 'string') {
          return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return String(value); // Convert all values to string for CSV
      })
    );
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users-list.csv';
    link.click();
  };

  // Print handler
  const handlePrint = () => {
    const printColumns = userColumns.map(col => ({ header: col.label, accessor: col.accessor }));

    const printFunction = PrintLayout({
      title: 'Users List',
      data: filteredUsers,
      columns: printColumns,
      totalItems: filteredUsers.length,
    });

    printFunction();
  };

  // Handler for downloading user import template
  const handleDownloadUserTemplate = () => {
    const templateData = [
      {
        userName: "john.doe",
        email: "john.doe@icct.edu",
        role: "STUDENT",
        status: "active",
        isEmailVerified: "false",
        twoFactorEnabled: "false"
      },
      {
        userName: "jane.smith",
        email: "jane.smith@icct.edu",
        role: "INSTRUCTOR",
        status: "active",
        isEmailVerified: "true",
        twoFactorEnabled: "true"
      },
      {
        userName: "admin.user",
        email: "admin@icct.edu",
        role: "ADMIN",
        status: "active",
        isEmailVerified: "true",
        twoFactorEnabled: "true"
      }
    ];

    const headers = [
      'userName',
      'email', 
      'role',
      'status',
      'isEmailVerified',
      'twoFactorEnabled'
    ];

    const ws = XLSX.utils.json_to_sheet(templateData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'users-import-template.xlsx');
  };

  // Handler for importing users
  const handleImportUsers = async (data: any[]) => {
    try {
      // Filter out invalid records and transform data
      const validRecords = data.filter(record => record.isValid !== false);
      
      if (validRecords.length === 0) {
        throw new Error('No valid records to import');
      }

      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: validRecords,
          options: {
            skipDuplicates: true,
            updateExisting: false,
            generatePasswords: true,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // Refresh the users list after successful import
      await fetchUsers(true);
      toast.success('Users imported successfully');
      return {
        success: result.results?.success || 0,
        failed: result.results?.failed || 0,
        errors: result.results?.errors || []
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to import users');
      throw error;
    }
  };

  // Handler for opening the bulk actions dialog
  const handleOpenBulkActionsDialog = () => {
    setSelectedUsersForBulkAction(selectedUsers);
    setBulkActionsDialogOpen(true);
  };
  // Handler for dialog action complete
  const handleBulkActionComplete = (actionType: string, results: any) => {
    toast.success(`Bulk action '${actionType}' completed.`);
    setBulkActionsDialogOpen(false);
    setSelectedUsersForBulkAction([]);
    fetchUsers(true);
  };
  // Handler for dialog cancel
  const handleBulkActionCancel = () => {
    setBulkActionsDialogOpen(false);
    setSelectedUsersForBulkAction([]);
  };
  // Handler for processing bulk actions
  const handleProcessBulkAction = async (actionType: string, config: any) => {
    if (actionType === 'status-update') {
      // Activate or deactivate selected users
      const status = config.status?.toLowerCase();
      
      // Filter out SUPER_ADMIN users from bulk operations
      const nonSuperAdminUsers = selectedUsersForBulkAction.filter(user => user.role !== 'SUPER_ADMIN');
      const superAdminUsers = selectedUsersForBulkAction.filter(user => user.role === 'SUPER_ADMIN');
      
      if (superAdminUsers.length > 0) {
        toast.warning(`${superAdminUsers.length} SUPER_ADMIN user(s) were excluded from this operation for security reasons.`);
      }
      
      if (nonSuperAdminUsers.length === 0) {
        toast.error('No eligible users found for this operation.');
        return { success: false, processed: 0 };
      }
      
      const updatePromises = nonSuperAdminUsers.map(async (user) => {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error(`Failed to update user ${user.userName}`);
        return response.json();
      });
      await Promise.all(updatePromises);
      return { success: true, processed: nonSuperAdminUsers.length };
    }
    if (actionType === 'export') {
      // Export handled in dialog
      return { success: true };
    }
    if (actionType === 'notification') {
      // Process notification with config
      const { subject, message, recipients, type = 'email' } = config;
      
      // Filter out SUPER_ADMIN users from notifications
      const nonSuperAdminUsers = selectedUsersForBulkAction.filter(user => user.role !== 'SUPER_ADMIN');
      const superAdminUsers = selectedUsersForBulkAction.filter(user => user.role === 'SUPER_ADMIN');
      
      if (superAdminUsers.length > 0) {
        toast.warning(`${superAdminUsers.length} SUPER_ADMIN user(s) were excluded from notifications for security reasons.`);
      }
      
      if (nonSuperAdminUsers.length === 0) {
        toast.error('No eligible users found for this operation.');
        return { success: false, processed: 0 };
      }
      
      // Simulate sending notifications to selected users
      const notificationPromises = nonSuperAdminUsers.map(async (user) => {
        // In a real implementation, this would send actual notifications
        // For now, we'll simulate the process
        await new Promise(resolve => setTimeout(resolve, 100));
        return { userId: user.id, userName: user.userName, success: true };
      });
      
      const results = await Promise.all(notificationPromises);
      return { 
        success: true, 
        processed: results.length,
        results: results
      };
    }
    return { success: false };
  };

  const handleExportSelectedUsers = (selectedUsers: User[]) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected for export');
      return;
    }
    handleExportCSV(selectedUsers, userColumns);
  };

  // Handler for bulk deactivate
  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected for deactivation');
      return;
    }

    // Filter out SUPER_ADMIN users
    const nonSuperAdminUsers = selectedUsers.filter(user => user.role !== 'SUPER_ADMIN');
    const superAdminUsers = selectedUsers.filter(user => user.role === 'SUPER_ADMIN');

    if (nonSuperAdminUsers.length === 0) {
      toast.error('No eligible users found for deactivation.');
      return;
    }

    // Filter out already inactive users
    const activeUsers = nonSuperAdminUsers.filter(user => user.status === 'active');
    
    if (activeUsers.length === 0) {
      toast.error('All selected users are already inactive.');
      return;
    }

    // Prepare confirmation data
    const message = `Are you sure you want to deactivate ${activeUsers.length} user(s)? This action can be reversed by reactivating the users.`;
    
    setBulkDeleteData({
      users: activeUsers,
      excludedUsers: superAdminUsers,
      message
    });
    setBulkDeleteConfirmOpen(true);
  };

  // Handler for confirming bulk deactivate
  const handleConfirmBulkDeactivate = async () => {
    if (!bulkDeleteData) return;

    try {
      setIsBulkDeactivating(true);
      setBulkDeleteConfirmOpen(false);

      // Deactivate users
      const deactivatePromises = bulkDeleteData.users.map(async (user) => {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error(`Failed to deactivate user ${user.userName}`);
        return response.json();
      });

      await Promise.all(deactivatePromises);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        bulkDeleteData.users.some(selected => selected.id === user.id) 
          ? { ...user, status: 'inactive' } 
          : user
      ));

      // Clear selection
      setSelectedIds([]);
      
      // Show success message with exclusion info
      let successMessage = `Successfully deactivated ${bulkDeleteData.users.length} user(s).`;
      if (bulkDeleteData.excludedUsers.length > 0) {
        successMessage += ` ${bulkDeleteData.excludedUsers.length} SUPER_ADMIN user(s) were excluded for security reasons.`;
      }
      
      toast.success(successMessage);
    } catch (error) {
      console.error('Bulk deactivation failed:', error);
      toast.error('Failed to deactivate some users. Please try again.');
    } finally {
      setIsBulkDeactivating(false);
      setBulkDeleteData(null);
    }
  };

  // Handler for bulk reactivate
  const handleBulkReactivate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected for reactivation');
      return;
    }

    // Filter out SUPER_ADMIN users
    const nonSuperAdminUsers = selectedUsers.filter(user => user.role !== 'SUPER_ADMIN');
    const superAdminUsers = selectedUsers.filter(user => user.role === 'SUPER_ADMIN');

    if (nonSuperAdminUsers.length === 0) {
      toast.error('No eligible users found for reactivation.');
      return;
    }

    // Filter out already active users
    const inactiveUsers = nonSuperAdminUsers.filter(user => user.status === 'inactive');
    
    if (inactiveUsers.length === 0) {
      toast.error('All selected users are already active.');
      return;
    }

    // Prepare confirmation data
    const message = `Are you sure you want to reactivate ${inactiveUsers.length} user(s)?`;
    
    setBulkReactivateData({
      users: inactiveUsers,
      excludedUsers: superAdminUsers,
      message
    });
    setBulkReactivateConfirmOpen(true);
  };

  // Handler for confirming bulk reactivate
  const handleConfirmBulkReactivate = async () => {
    if (!bulkReactivateData) return;

    try {
      setIsBulkReactivating(true);
      setBulkReactivateConfirmOpen(false);

      // Reactivate users
      const reactivatePromises = bulkReactivateData.users.map(async (user) => {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        });
        if (!response.ok) throw new Error(`Failed to reactivate user ${user.userName}`);
        return response.json();
      });

      await Promise.all(reactivatePromises);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        bulkReactivateData.users.some(selected => selected.id === user.id) 
          ? { ...user, status: 'active' } 
          : user
      ));

      // Clear selection
      setSelectedIds([]);
      
      // Show success message with exclusion info
      let successMessage = `Successfully reactivated ${bulkReactivateData.users.length} user(s).`;
      if (bulkReactivateData.excludedUsers.length > 0) {
        successMessage += ` ${bulkReactivateData.excludedUsers.length} SUPER_ADMIN user(s) were excluded for security reasons.`;
      }
      
      toast.success(successMessage);
    } catch (error) {
      console.error('Bulk reactivation failed:', error);
      toast.error('Failed to reactivate some users. Please try again.');
    } finally {
      setIsBulkReactivating(false);
      setBulkReactivateData(null);
    }
  };

  const selectedUsers = users.filter(user => selectedIds.includes(user.id));

  const [exportColumns, setExportColumns] = useState<string[]>(exportableColumns.map(col => col.accessor));

  // Get unique roles and user types for filter dropdowns
  const roleOptions = useMemo(() => {
    const roles = users.map(u => u.role).filter((role): role is string => typeof role === 'string' && !!role);
    return Array.from(new Set(roles)).sort();
  }, [users]);



  const handleView = (user: User) => {
    setViewUser(user);
    setViewDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalUser(user);
    setModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete({ id: user.id, name: user.userName });
    setDeleteDialogOpen(true);
  };



  // Handler to restore (reactivate) an inactive user
  const handleRestore = async (user: User) => {
    setRestoringId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // If response is empty or invalid JSON
        data = null;
      }
      if (!res.ok || !data || data.error) {
        toast.error(data?.error || 'Failed to restore user.');
        setRestoringId(null);
        return;
      }
      toast.success('User restored successfully!');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to restore user.');
    } finally {
      setRestoringId(null);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to deactivate user');

      setUsers(prev => prev.map(u => 
        u.id === userToDelete.id ? { ...u, status: 'inactive' } : u
      ));
      toast.success('User deactivated successfully');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error('Failed to deactivate user');
    }
  };

  const refreshUsers = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.data || []);
      toast.success('Users refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh users');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Users"
          subtitle="Manage system users and their permissions"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "User Management", href: "/user-management" },
            { label: "Users" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Users className="text-blue-700 w-5 h-5" />}
            label="Total Users"
            value={users.length}
            valueClassName="text-blue-900"
            sublabel="Total number of users"
            loading={loading}
          />
          <SummaryCard
            icon={<UserCheck className="text-blue-700 w-5 h-5" />}
            label="Active Users"
            value={users.filter(u => u.status === 'active').length}
            valueClassName="text-blue-900"
            sublabel="Currently active"
            loading={loading}
          />
          <SummaryCard
            icon={<UserX className="text-blue-700 w-5 h-5" />}
            label="Inactive Users"
            value={users.filter(u => u.status === 'inactive').length}
            valueClassName="text-blue-900"
            sublabel="Inactive or suspended"
            loading={loading}
          />
          <SummaryCard
            icon={<Shield className="text-blue-700 w-5 h-5" />}
            label="Verified Users"
            value={users.filter(u => u.isEmailVerified).length}
            valueClassName="text-blue-900"
            sublabel="Email verified"
            loading={loading}
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential tools and shortcuts"
            icon={
              <div className="w-6 h-6 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            }
            actionCards={[
              {
                id: 'add-user',
                label: 'Add User',
                description: 'Create new user',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => { 
                  setSelectedUser(null); 
                  setAddModalOpen(true); 
                }
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import users from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print user list',
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
                description: 'Reload user data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: () => fetchUsers(true),
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
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">User List</h3>
                      <p className="text-blue-100 text-sm">Search and filter user information</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Error State */}
            {error && (
              <div className="p-3 sm:p-4 lg:p-6 bg-red-50 border-b border-red-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-red-800 text-sm sm:text-base">Error Loading Data</h4>
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              {/* Search Results Summary */}
              {searchInput && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Search results for "{searchInput}"
                      </span>
                      <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                        {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchInput('')}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* Search Bar - Takes up space on larger screens */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                  )}
                  <input
                    type="text"
                    placeholder="Search users by name, email, role, student ID... (Ctrl+K to focus)"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className={`w-full pl-10 pr-10 h-9 sm:h-10 border border-gray-300 rounded text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-all duration-200 ${
                      searchInput ? 'border-blue-300 bg-blue-50/30' : ''
                    }`}
                  />
                  {searchInput && (
                    <button
                      onClick={() => setSearchInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Quick Filter Dropdowns - In one row on larger screens */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 sm:w-36 text-xs sm:text-sm text-gray-500 h-9 sm:h-10 rounded">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" /></span> Active
                        </span>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><X className="w-3 h-3 sm:w-4 sm:h-4" /></span> Inactive
                        </span>
                      </SelectItem>
                      <SelectItem value="suspended">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-500"><Archive className="w-3 h-3 sm:w-4 sm:h-4" /></span> Suspended
                        </span>
                      </SelectItem>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500"><Clock className="w-3 h-3 sm:w-4 sm:h-4" /></span> Pending
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-28 sm:w-32 text-xs sm:text-sm text-gray-500 h-9 sm:h-10 rounded">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger className="w-36 sm:w-40 text-xs sm:text-sm text-gray-500 h-9 sm:h-10 rounded">
                      <SelectValue placeholder="Email Verification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Verification</SelectItem>
                      <SelectItem value="email-verified">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><Mail className="w-3 h-3 sm:w-4 sm:h-4" /></span> Email Verified
                        </span>
                      </SelectItem>
                      <SelectItem value="not-verified">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-500"><X className="w-3 h-3 sm:w-4 sm:h-4" /></span> Not Verified
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={twoFactorFilter} onValueChange={setTwoFactorFilter}>
                    <SelectTrigger className="w-24 sm:w-28 text-xs sm:text-sm text-gray-500 h-9 sm:h-10 rounded">
                      <SelectValue placeholder="2FA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All 2FA</SelectItem>
                      <SelectItem value="enabled">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><Shield className="w-3 h-3 sm:w-4 sm:h-4" /></span> Enabled
                        </span>
                      </SelectItem>
                      <SelectItem value="disabled">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-500"><X className="w-3 h-3 sm:w-4 sm:h-4" /></span> Disabled
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={loginActivityFilter} onValueChange={setLoginActivityFilter}>
                    <SelectTrigger className="w-32 sm:w-36 text-xs sm:text-sm text-gray-500 h-9 sm:h-10 rounded">
                      <SelectValue placeholder="Activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activity</SelectItem>
                      <SelectItem value="recent">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><Activity className="w-3 h-3 sm:w-4 sm:h-4" /></span> Recent (7d)
                        </span>
                      </SelectItem>
                      <SelectItem value="active">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-600"><Activity className="w-3 h-3 sm:w-4 sm:h-4" /></span> Active (30d)
                        </span>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-500"><Clock className="w-3 h-3 sm:w-4 sm:h-4" /></span> Inactive
                        </span>
                      </SelectItem>
                      <SelectItem value="never-logged-in">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><X className="w-3 h-3 sm:w-4 sm:h-4" /></span> Never Logged In
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="mt-2 sm:mt-3 px-2 sm:px-3 lg:px-6 max-w-full">
                <BulkActionsBar
                  selectedCount={selectedIds.length}
                  entityLabel="user"
                  actions={[
                    {
                      key: "bulk-actions",
                      label: "Bulk Actions",
                      icon: <Settings className="w-4 h-4 mr-2" />,
                      onClick: handleOpenBulkActionsDialog,
                      tooltip: "Open enhanced bulk actions dialog with status updates, notifications, and exports",
                      variant: "default"
                    },
                    {
                      key: "export",
                      label: "Quick Export",
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: () => handleExportSelectedUsers(selectedUsers),
                      tooltip: "Quick export selected users to CSV"
                    },
                    {
                      key: "deactivate",
                      label: "Deactivate Selected",
                      icon: isBulkDeactivating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: handleBulkDeactivate,
                      loading: isBulkDeactivating,
                      disabled: isBulkDeactivating || isBulkReactivating || selectedUsers.every(u => u.status === "inactive") || selectedUsers.every(u => u.role === "SUPER_ADMIN"),
                      tooltip: "Deactivate selected users (can be reactivated later)",
                      variant: "destructive",
                      hidden: selectedUsers.length === 0 || selectedUsers.every(u => u.status === "inactive") || selectedUsers.every(u => u.role === "SUPER_ADMIN")
                    },
                    {
                      key: "reactivate",
                      label: "Reactivate Selected",
                      icon: isBulkReactivating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />,
                      onClick: handleBulkReactivate,
                      loading: isBulkReactivating,
                      disabled: isBulkDeactivating || isBulkReactivating || selectedUsers.every(u => u.status !== "inactive") || selectedUsers.every(u => u.role === "SUPER_ADMIN"),
                      tooltip: "Reactivate selected inactive users",
                      variant: "default",
                      hidden: selectedUsers.length === 0 || selectedUsers.every(u => u.status !== "inactive") || selectedUsers.every(u => u.role === "SUPER_ADMIN")
                    }
                  ]}
                  onClear={() => setSelectedIds([])}
                />
                
                {/* SUPER_ADMIN Warning */}
                {selectedUsers.some(u => u.role === 'SUPER_ADMIN') && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        SUPER_ADMIN users are protected from bulk operations for security reasons.
                      </span>
                    </div>
              </div>
            )}
              </div>
            )}
            
            {/* Table layout for xl+ only */}
            <div className="hidden xl:block">
              <div className="px-4 sm:px-6 pt-6 pb-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                      <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {loading ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
                          <span className="text-base sm:text-lg font-semibold text-blue-900">Loading users...</span>
                      </div>
                        <p className="text-xs sm:text-sm text-blue-700 text-center">Please wait while we fetch the latest data</p>
                    </div>
                  ) : !loading && filteredUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4">
                      <EmptyState
                          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />}
                        title={searchInput ? "No users found matching your search" : "No users found"}
                        description={searchInput ? 
                          `No users match "${searchInput}". Try different keywords or clear the search.` : 
                          "Try adjusting your search criteria or filters to find the users you're looking for."
                        }
                        action={
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                            {searchInput && (
                              <Button
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-sm sm:text-base"
                                onClick={() => setSearchInput('')}
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                Clear Search
                              </Button>
                            )}
                            <Button
                              variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-sm sm:text-base"
                              onClick={() => fetchUsers(true)}
                            >
                                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              Refresh Data
                            </Button>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <TableList
                      columns={columns}
                      data={paginatedUsers}
                      loading={loading}
                      selectedIds={selectedIds}
                      emptyMessage={null}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                      isAllSelected={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      getItemId={(item) => item.id}
                      className="border-0 shadow-none max-w-full"
                      sortState={{ field: sortField, order: sortOrder }}
                      onSort={handleSort}
                      expandedRowIds={expandedRowIds}
                      onToggleExpand={handleToggleExpand}
                    />
                  )}
                  </div>
                </div>
                </div>
              </div>
              
            {/* Card layout for small screens */}
            <div className="block xl:hidden p-2 sm:p-3 lg:p-4 max-w-full">
              <div className="px-2 sm:px-4 pt-6 pb-6">
                {!loading && filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <EmptyState
                      icon={<Users className="w-6 h-6 text-blue-400" />}
                      title={searchInput ? "No users found matching your search" : "No users found"}
                      description={searchInput ? 
                        `No users match "${searchInput}". Try different keywords or clear the search.` : 
                        "Try adjusting your search criteria or filters to find the users you're looking for."
                      }
                      action={
                        <div className="flex flex-col gap-2 w-full">
                          {searchInput && (
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={() => setSearchInput('')}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Clear Search
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                            onClick={() => fetchUsers(true)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                          </Button>
                        </div>
                      }
                    />
                  </div>
                ) : (
                <TableCardView
                  items={paginatedUsers}
                  selectedIds={selectedIds}
                  onSelect={handleSelectRow}
                  onView={(item) => {
                    setSelectedUser(item);
                    setViewModalOpen(true);
                  }}
                  onEdit={(item) => {
                    setSelectedUser(item);
                    setEditModalOpen(true);
                  }}
                    onDelete={(item) => handleDelete(item)}
                  getItemId={(item) => item.id}
                  getItemName={(item) => item.userName}
                  getItemCode={(item) => item.id}
                  getItemStatus={(item) => item.status as 'active' | 'inactive'}
                  getItemDescription={(item) => item.fullName}
                  getItemDetails={(item) => [
                    { label: 'Email', value: item.email },
                    { label: 'Role', value: item.role },
                    { label: 'Student ID', value: item.relatedInfo?.studentIdNum || 'N/A' },
                    { label: 'Last Login', value: item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : 'Never' },
                  ]}
                    disabled={(item) => item.role === 'SUPER_ADMIN'}
                  isLoading={loading}
                />
                )}
              </div>
              </div>
              
              {/* Pagination */}
              <TablePagination
                page={currentPage}
                pageSize={itemsPerPage}
                totalItems={filteredUsers.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
              pageSizeOptions={[10, 25, 50, 100]}
              loading={loading}
              />
          </Card>
        </div>

        {/* Add User Dialog */}
        <UserForm
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          type="create"
          onSuccess={() => {
            setAddModalOpen(false);
            fetchUsers();
          }}
        />


        {/* Keep existing dialogs */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setUserToDelete(null);
          }}
          itemName={userToDelete?.name}
          onDelete={confirmDelete}
          onCancel={() => { setDeleteDialogOpen(false); setUserToDelete(null); }}
          canDelete={true}
          description={userToDelete ? `Are you sure you want to deactivate the user "${userToDelete.name}"? This action can be reversed by reactivating the user.` : undefined}
        />

        {editModalOpen && selectedUser && (
          <UserForm
            key={selectedUser.id}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            type="update"
            data={normalizeForSelect({
              ...selectedUser,
              role: (selectedUser.role as string) || 'STUDENT',
              status: (selectedUser.status as any) || 'active'
            }) as unknown as User}
            id={selectedUser.id}
            onSuccess={() => {
              setEditModalOpen(false);
              fetchUsers();
            }}
          />
        )}

        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortOptions={userSortFieldOptions}
          currentSort={{ field: sortField, order: sortOrder }}
          onSortChange={(field, order) => {
            setSortField(field as UserSortField);
            setSortOrder(order as UserSortOrder);
            setSortFields([{ field: field as SortField, order }]);
          }}
          title="Sort Users"
          description="Sort users by different fields. Choose the field and order to organize your list."
        />

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={async (format, options) => {
            setExportFormat(format);
            await handleExport();
          }}
          dataCount={selectedIds.length > 0 ? selectedIds.length : filteredUsers.length}
          entityType="student"
        />

        {/* View User Dialog */}
        <ViewDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedUser ? `${selectedUser.userName}` : "User Details"}
          subtitle={selectedUser?.email}
          status={selectedUser ? {
            value: selectedUser.status,
            variant: selectedUser.status === "active" ? "success" : 
                    selectedUser.status === "inactive" ? "destructive" : 
                    selectedUser.status === "suspended" ? "secondary" : "warning"
          } : undefined}
          headerVariant="default"
          sections={selectedUser ? ([
            {
              title: "User Information",
              fields: [
                { label: 'User ID', value: String(selectedUser.id), icon: <Hash className="w-4 h-4 text-blue-600" /> },
                { label: 'Username', value: selectedUser.userName, icon: <UserCheckIcon className="w-4 h-4 text-blue-600" /> },
                { label: 'Email', value: selectedUser.email, icon: <Mail className="w-4 h-4 text-blue-600" /> },
                { label: 'Full Name', value: selectedUser.fullName, icon: <UserCheckIcon className="w-4 h-4 text-blue-600" /> },
                { label: 'Student ID', value: selectedUser.relatedInfo?.studentIdNum || 'N/A', icon: <GraduationCap className="w-4 h-4 text-blue-600" /> },
                { label: 'Role', value: selectedUser.role, icon: <Shield className="w-4 h-4 text-blue-600" /> },
                { label: 'Status', value: selectedUser.status, icon: <Info className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Security & Verification",
              fields: [
                { label: 'Failed Login Attempts', value: String(selectedUser.failedLoginAttempts), icon: <Key className="w-4 h-4 text-blue-600" /> },
                { label: 'Email Verified', value: selectedUser.isEmailVerified ? 'Yes' : 'No', icon: <Mail className="w-4 h-4 text-blue-600" /> },
                { label: 'Two-Factor Auth', value: selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled', icon: <Shield className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Activity & Timestamps",
              fields: [
                { label: 'Last Login', value: selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never', type: 'date', icon: <Activity className="w-4 h-4 text-blue-600" /> },
                { label: 'Last Password Change', value: selectedUser.lastPasswordChange ? new Date(selectedUser.lastPasswordChange).toLocaleString() : 'Never', type: 'date', icon: <Key className="w-4 h-4 text-blue-600" /> },
                { label: 'Created At', value: selectedUser.createdAt, type: 'date', icon: <Calendar className="w-4 h-4 text-blue-600" /> },
                { label: 'Last Updated', value: selectedUser.updatedAt, type: 'date', icon: <RefreshCw className="w-4 h-4 text-blue-600" /> },
              ]
            },
            selectedUser.statistics ? {
              title: "Activity Statistics",
              fields: [
                { label: 'Total Attendance', value: String(selectedUser.statistics.totalAttendance), icon: <Activity className="w-4 h-4 text-blue-600" /> },
                { label: 'System Logs', value: String(selectedUser.statistics.totalSystemLogs), icon: <FileText className="w-4 h-4 text-blue-600" /> },
                { label: 'Report Logs', value: String(selectedUser.statistics.totalReportLogs), icon: <FileText className="w-4 h-4 text-blue-600" /> },
                { label: 'RFID Logs', value: String(selectedUser.statistics.totalRFIDLogs), icon: <Activity className="w-4 h-4 text-blue-600" /> },
              ]
            } : undefined
          ].filter(Boolean) as import('@/components/reusable/Dialogs/ViewDialog').ViewDialogSection[]) : []}
          description={selectedUser?.role ? `Role: ${selectedUser.role}` : undefined}
          tooltipText="View detailed user information"
        />

        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={COLUMN_OPTIONS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onReset={handleResetColumns}
          title="Manage User Columns"
          description="Choose which columns to display in the user table"
          searchPlaceholder="Search user columns..."
          enableManualSelection={true}
        />

        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImportUsers}
          entityName="users"
          templateUrl={undefined}
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={10}
          templateBuilder={handleDownloadUserTemplate}
          fileRequirements={
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">File Requirements for User Import:</p>
                <ul className="space-y-1">
                  <li>• File must be in CSV or Excel format</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• <b>Required columns:</b> <code className="bg-gray-100 px-1 rounded">userName</code>, <code className="bg-gray-100 px-1 rounded">email</code>, <code className="bg-gray-100 px-1 rounded">role</code></li>
                  <li>• <b>Optional columns:</b> <code className="bg-gray-100 px-1 rounded">status</code>, <code className="bg-gray-100 px-1 rounded">isEmailVerified</code>, <code className="bg-gray-100 px-1 rounded">twoFactorEnabled</code></li>
                  <li>• <b>role</b> values: <code className="bg-blue-100 px-1 rounded">SUPER_ADMIN</code>, <code className="bg-blue-100 px-1 rounded">ADMIN</code>, <code className="bg-blue-100 px-1 rounded">DEPARTMENT_HEAD</code>, <code className="bg-blue-100 px-1 rounded">INSTRUCTOR</code>, <code className="bg-blue-100 px-1 rounded">STUDENT</code></li>
                  <li>• <b>status</b> values: <code className="bg-green-100 px-1 rounded">active</code>, <code className="bg-green-100 px-1 rounded">inactive</code>, <code className="bg-green-100 px-1 rounded">suspended</code>, <code className="bg-green-100 px-1 rounded">pending</code>, <code className="bg-green-100 px-1 rounded">blocked</code> (defaults to <code className="bg-green-100 px-1 rounded">active</code>)</li>
                  <li>• <b>isEmailVerified</b>/<b>twoFactorEnabled</b>: <code className="bg-yellow-100 px-1 rounded">true</code> or <code className="bg-yellow-100 px-1 rounded">false</code> (defaults to <code className="bg-yellow-100 px-1 rounded">false</code>)</li>
                  <li>• <b>userName</b> must be unique and between 3-50 characters</li>
                  <li>• <b>email</b> must be valid email format and unique</li>
                  <li>• <b>Passwords will be auto-generated</b> and sent to users via email</li>
                  <li>• <b>SUPER_ADMIN</b> role is restricted and cannot be imported</li>
                </ul>
              </div>
            </div>
          }
        />

        <BulkActionsDialog<User>
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={selectedUsersForBulkAction}
          entityType="user"
          entityLabel="user"
          availableActions={[
            { 
              id: 'status-update', 
              label: 'Update User Status', 
              description: 'Activate, deactivate, or suspend selected users', 
              icon: <Settings className="w-4 h-4" />,
              tabId: 'status'
            },
            { 
              id: 'notification', 
              label: 'Send Notifications', 
              description: 'Send email notifications to selected users', 
              icon: <Bell className="w-4 h-4" />,
              tabId: 'notifications'
            },
            { 
              id: 'export', 
              label: 'Export User Data', 
              description: 'Export user information in various formats', 
              icon: <Download className="w-4 h-4" />,
              tabId: 'export'
            },
          ]}
          onActionComplete={handleBulkActionComplete}
          onCancel={handleBulkActionCancel}
          onProcessAction={handleProcessBulkAction}
          getItemDisplayName={(item: User) => item.userName}
          getItemStatus={(item: User) => item.status}
          getItemId={(item: User) => item.id}
        />

        {/* Legacy dialogs for backward compatibility */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          itemName={userToDelete?.name ?? ''}
          onDelete={confirmDelete}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }}
          canDelete={true}
          description={userToDelete ? 
            `Are you sure you want to deactivate the user "${userToDelete.name}"? This action can be reversed by reactivating the user.` :
            'Are you sure you want to deactivate this user? This action can be reversed by reactivating the user.'}
        />

        <UserForm
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              setModalUser(undefined);
            }
          }}
          type="update"
          data={modalUser}
          id={modalUser?.id}
          onSuccess={async () => {
            setModalOpen(false);
            setModalUser(undefined);
            await refreshUsers();
          }}
        />

        <ViewDialog
          open={viewDialogOpen}
          onOpenChange={(open) => {
            setViewDialogOpen(open);
            if (!open) setViewUser(undefined);
          }}
          title={viewUser?.userName || ''}
          subtitle={viewUser?.email}
          status={viewUser ? {
            value: viewUser.status,
            variant: viewUser.status === "active" ? "success" : "destructive"
          } : undefined}
          sections={[
            {
              title: "User Information",
              fields: [
                { label: 'Role', value: viewUser?.role || 'Unknown', type: 'text' },
                { label: 'Full Name', value: viewUser?.fullName || 'N/A', type: 'text' },
                { label: 'Failed Login Attempts', value: viewUser?.failedLoginAttempts || 0, type: 'number' }
              ]
            },
            {
              title: "Verification Status",
              fields: [
                { label: 'Email Verified', value: viewUser?.isEmailVerified ? 'Yes' : 'No', type: 'text' },
                { label: 'Two-Factor Auth', value: viewUser?.twoFactorEnabled ? 'Enabled' : 'Disabled', type: 'text' }
              ]
            },
            {
              title: "Activity Statistics",
              fields: viewUser?.statistics ? [
                { label: 'Total Attendance', value: viewUser.statistics.totalAttendance, type: 'number' },
                { label: 'System Logs', value: viewUser.statistics.totalSystemLogs, type: 'number' },
                { label: 'Report Logs', value: viewUser.statistics.totalReportLogs, type: 'number' },
                { label: 'RFID Logs', value: viewUser.statistics.totalRFIDLogs, type: 'number' }
              ] : []
            }
          ]}
          tooltipText="View detailed user information"
          showPrintButton={true}
          showCopyButton={true}
        />

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Confirm Bulk Deactivation
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {bulkDeleteData?.message}
              </DialogDescription>
            </DialogHeader>

            {bulkDeleteData && (
              <div className="space-y-4">
                {/* Excluded users */}
                {bulkDeleteData.excludedUsers.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-900">
                        Excluded users ({bulkDeleteData.excludedUsers.length})
                      </span>
                    </div>
                    <div className="text-sm text-yellow-800">
                      SUPER_ADMIN users are protected from deactivation for security reasons.
                    </div>
                  </div>
                )}

                {/* Warning message */}
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-900">Important</span>
                  </div>
                  <div className="text-sm text-red-800">
                    This action will deactivate the selected users. They will no longer be able to access the system until reactivated.
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkDeleteConfirmOpen(false);
                  setBulkDeleteData(null);
                }}
                disabled={isBulkDeactivating}
                className="rounded"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmBulkDeactivate}
                disabled={isBulkDeactivating}
                className="rounded"
              >
                {isBulkDeactivating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deactivate Users
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Reactivate Confirmation Dialog */}
        <Dialog open={bulkReactivateConfirmOpen} onOpenChange={setBulkReactivateConfirmOpen}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-green-600" />
                Confirm Bulk Reactivation
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {bulkReactivateData?.message}
              </DialogDescription>
            </DialogHeader>

            {bulkReactivateData && (
              <div className="space-y-4">
                {/* Users to be reactivated */}
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-900">
                      Users to be reactivated ({bulkReactivateData.users.length})
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {bulkReactivateData.users.slice(0, 5).map((user, index) => (
                      <div key={user.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-800 font-medium">{user.userName}</span>
                        <span className="text-green-600">({user.email})</span>
                      </div>
                    ))}
                    {bulkReactivateData.users.length > 5 && (
                      <div className="text-xs text-green-600 italic">
                        +{bulkReactivateData.users.length - 5} more users
                      </div>
                    )}
                  </div>
                </div>

                {/* Excluded users */}
                {bulkReactivateData.excludedUsers.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-900">
                        Excluded users ({bulkReactivateData.excludedUsers.length})
                      </span>
                    </div>
                    <div className="text-sm text-yellow-800">
                      SUPER_ADMIN users are protected from reactivation for security reasons.
                    </div>
                  </div>
                )}

                {/* Info message */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900">Information</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    This action will reactivate the selected users. They will be able to access the system again.
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkReactivateConfirmOpen(false);
                  setBulkReactivateData(null);
                }}
                disabled={isBulkReactivating}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmBulkReactivate}
                disabled={isBulkReactivating}
                className="rounded-xl bg-green-600 hover:bg-green-700"
              >
                {isBulkReactivating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reactivating...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reactivate Users
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 