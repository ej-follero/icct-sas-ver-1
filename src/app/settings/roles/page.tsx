"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  Eye, 
  Shield, 
  UserCheck, 
  UserX, 
  Users,
  Settings,
  Loader2,
  Upload,
  List,
  Columns3,
  RefreshCw,
  Download,
  Bell,
  Archive,
  FileText,
  Info,
  Clock,
  Hash,
  AlertTriangle,
  Printer,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react';
import { toast } from "sonner";
import Fuse from "fuse.js";
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { TableCardView } from '@/components/reusable/Table/TableCardView';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { EmptyState } from '@/components/reusable';
import SummaryCard from '@/components/SummaryCard';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/PageHeader/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ViewDialog } from '@/components/reusable/Dialogs/ViewDialog';

import { VisibleColumnsDialog, ColumnOption } from '@/components/reusable/Dialogs/VisibleColumnsDialog';
import { ImportDialog } from '@/components/reusable/Dialogs/ImportDialog';
import { SortDialog } from '@/components/reusable/Dialogs/SortDialog';
import { BulkActionsDialog } from '@/components/reusable/Dialogs/BulkActionsDialog';
import { PrintLayout } from '@/components/PrintLayout';
import RoleForm from '@/components/forms/RoleForm';
import { roleService, type BulkImportRoleData, type Role } from '@/lib/services/role.service';

// SUPER_ADMIN permissions - all system permissions
const SUPER_ADMIN_PERMISSIONS = [
  // User Management
  'View Users', 'Edit Users', 'Delete Users', 'Assign Roles',
  'Manage Super Admins', 'Manage Admin Users', 'User Security Settings',
  
  // Attendance Management
  'View Attendance', 'Edit Attendance', 'Delete Attendance',
  'Override Attendance', 'Verify Attendance', 'Export Attendance',
  
  // Academic Management
  'Manage Courses', 'Manage Departments', 'Manage Subjects',
  'Manage Sections', 'Manage Instructors', 'Manage Students',
  'Manage Rooms', 'Manage Schedules',
  
  // Reports & Analytics
  'View Reports', 'Generate Reports', 'Export Data',
  'View Analytics', 'System Analytics',
  
  // System Administration
  'System Settings', 'Database Management', 'Backup & Restore',
  'Security Settings', 'API Management', 'System Monitoring',
  'Audit Logs', 'Emergency Access',
  
  // RFID Management
  'Manage RFID Tags', 'Manage RFID Readers',
  'View RFID Logs', 'RFID Configuration',
  
  // Communication
  'Send Announcements', 'Manage Communications',
  'Email Management', 'Notification Settings',
  
  // Department Specific
  'Department Management', 'Department Reports', 'Department Users',
];

// ADMIN permissions - general administrative tasks (excluding SUPER_ADMIN management)
const ADMIN_PERMISSIONS = [
  // User Management (excluding SUPER_ADMIN)
  'View Users', 'Edit Users', 'Delete Users', 'Assign Roles',
  'Manage Admin Users', 'User Security Settings',
  
  // Attendance Management
  'View Attendance', 'Edit Attendance', 'Delete Attendance',
  'Override Attendance', 'Verify Attendance', 'Export Attendance',
  
  // Academic Management
  'Manage Courses', 'Manage Departments', 'Manage Subjects',
  'Manage Sections', 'Manage Instructors', 'Manage Students',
  'Manage Rooms', 'Manage Schedules',
  
  // Reports & Analytics
  'View Reports', 'Generate Reports', 'Export Data',
  'View Analytics',
  
  // Basic System Administration
  'System Settings', 'Security Settings', 'System Monitoring',
  
  // RFID Management
  'Manage RFID Tags', 'Manage RFID Readers',
  'View RFID Logs', 'RFID Configuration',
  
  // Communication
  'Send Announcements', 'Manage Communications',
  'Email Management', 'Notification Settings',
  
  // Department Specific
  'Department Management', 'Department Reports', 'Department Users',
];

// DEPARTMENT_HEAD permissions - department-specific management
const DEPARTMENT_HEAD_PERMISSIONS = [
  // Department-specific user management
  'View Users', 'Edit Users', 'Assign Roles',
  'Manage Admin Users', 'User Security Settings',
  
  // Department attendance management
  'View Attendance', 'Edit Attendance', 'Override Attendance',
  'Verify Attendance', 'Export Attendance',
  
  // Department academic management
  'Manage Courses', 'Manage Departments', 'Manage Subjects',
  'Manage Instructors', 'Manage Students',
  
  // Department reports
  'View Reports', 'Generate Reports', 'Export Data',
  'Department Management', 'Department Reports', 'Department Users',
  
  // Department communication
  'Send Announcements', 'Manage Communications',
];

// INSTRUCTOR permissions - classroom management
const INSTRUCTOR_PERMISSIONS = [
  'View Users', 'View Attendance', 'Edit Attendance',
  'View Reports', 'Send Announcements',
];

// STUDENT permissions - self-service access
const STUDENT_PERMISSIONS = [
  'View Attendance', 'View Reports',
];


const initialRoles: Role[] = [
  { 
    id: '1', 
    name: 'SUPER_ADMIN', 
    description: 'Highest level of system access with all permissions', 
    permissions: SUPER_ADMIN_PERMISSIONS,
    status: 'ACTIVE',
    totalUsers: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '2', 
    name: 'ADMIN', 
    description: 'General administrative tasks and oversight', 
    permissions: ADMIN_PERMISSIONS,
    status: 'ACTIVE',
    totalUsers: 5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '3', 
    name: 'DEPARTMENT_HEAD', 
    description: 'Manage department-specific operations and users', 
    permissions: DEPARTMENT_HEAD_PERMISSIONS,
    status: 'ACTIVE',
    totalUsers: 8,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '4', 
    name: 'INSTRUCTOR', 
    description: 'Manage classes and attendance', 
    permissions: INSTRUCTOR_PERMISSIONS,
    status: 'ACTIVE',
    totalUsers: 25,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  { 
    id: '5', 
    name: 'STUDENT', 
    description: 'View own attendance and schedule', 
    permissions: STUDENT_PERMISSIONS,
    status: 'ACTIVE',
    totalUsers: 500,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  
];

// Column definitions with optimized widths
const roleColumns = [
  { key: 'name', label: 'Role Name', accessor: 'name', className: 'text-blue-900 font-medium', sortable: true, width: 'w-28 sm:w-32 md:w-40 lg:w-48' },
  { key: 'description', label: 'Description', accessor: 'description', className: 'text-blue-900', sortable: true, width: 'w-32 sm:w-40 md:w-60 lg:w-80' },
  { key: 'permissions', label: 'Permissions', accessor: 'permissions', className: 'text-center text-blue-900', sortable: true, width: 'w-20 sm:w-24 md:w-28 lg:w-32' },
  { key: 'totalUsers', label: 'Users', accessor: 'totalUsers', className: 'text-center text-blue-900', sortable: true, width: 'w-14 sm:w-16 md:w-18 lg:w-20' },
  { key: 'status', label: 'Status', accessor: 'status', className: 'text-center', sortable: true, width: 'w-18 sm:w-20 md:w-22 lg:w-24' },
];

// Expander column for expandable rows
const EXPANDER_COLUMN: TableListColumn<Role> = {
  header: '',
  accessor: 'expander',
  className: 'w-6 sm:w-8 text-center px-1 py-1',
  expandedContent: (item: Role) => (
    <td colSpan={roleColumns.length + 3} className="bg-transparent px-0 py-0">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8 bg-white shadow-lg border border-blue-100">
        {/* Permissions Section */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Permissions ({item.permissions.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {item.permissions.map((permission, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-blue-900">{permission}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Role Details Section */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Role Details
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Hash className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-900">Role ID:</span>
                <span className="text-sm text-blue-700">{item.id}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-900">Total Users:</span>
                <span className="text-sm text-blue-700">{item.totalUsers}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-900">Created:</span>
                <span className="text-sm text-blue-700">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-900">Last Updated:</span>
                <span className="text-sm text-blue-700">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </td>
  ),
};

const exportableColumns: { accessor: string; label: string }[] = roleColumns.map((col) => ({ accessor: col.key, label: col.label }));

const COLUMN_OPTIONS: ColumnOption[] = roleColumns.map(col => ({
  accessor: typeof col.accessor === 'string' ? col.accessor : col.key,
  header: col.label,
  description: undefined,
  category: 'Role Info',
  required: col.key === 'name' || col.key === 'description',
}));

const roleSortFieldOptions = [
  { value: 'name', label: 'Role Name' },
  { value: 'description', label: 'Description' },
  { value: 'permissions', label: 'Permissions Count' },
  { value: 'totalUsers', label: 'Users' },
  { value: 'status', label: 'Status' },
];

type RoleSortField = 'name' | 'description' | 'permissions' | 'totalUsers' | 'status';
type RoleSortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function RolesPage() {
  // Add custom styles for line-clamp
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<RoleSortField>('name');
  const [sortOrder, setSortOrder] = useState<RoleSortOrder>('asc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(roleColumns.map(col => col.key));
  const [visibleColumnsDialogOpen, setVisibleColumnsDialogOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [selectedRolesForBulkAction, setSelectedRolesForBulkAction] = useState<Role[]>([]);

  // Mock current user role - in real app, get from auth context
  const currentUserRole = 'ADMIN' as string; // This should come from authentication context

  // Helper function to check if current user can manage a role
  const canManageRole = (role: Role) => {
    // SUPER_ADMIN can manage all roles
    if (currentUserRole === 'SUPER_ADMIN') return true;
    
    // ADMIN cannot manage SUPER_ADMIN roles
    if (currentUserRole === 'ADMIN' && role.name === 'SUPER_ADMIN') return false;
    
    // DEPARTMENT_HEAD can only manage roles at their level and below
    if (currentUserRole === 'DEPARTMENT_HEAD') {
      const roleHierarchy = ['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR', 'STUDENT', 'SYSTEM_AUDITOR'];
      const currentUserIndex = roleHierarchy.indexOf(currentUserRole);
      const roleIndex = roleHierarchy.indexOf(role.name);
      return roleIndex >= currentUserIndex;
    }
    
    // Other roles cannot manage any roles
    return false;
  };

  // Helper function to check if current user can create roles
  const canCreateRole = () => {
    return currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';
  };

  // Fuse.js setup for fuzzy search
  const fuse = useMemo(() => new Fuse<Role>(roles, {
    keys: ["name", "description"],
    threshold: 0.4,
    includeMatches: true,
  }), [roles]);

  // Load initial data function
  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const fetchedRoles = await roleService.getAllRoles();
      setRoles(fetchedRoles);
      setError(null);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setError('Failed to load roles data');
      toast.error('Failed to load roles data');
      // Fall back to initial roles if API fails
      setRoles(initialRoles);
    } finally {
      setInitialLoading(false);
    }
  };

  // Simulate initial data loading
  useEffect(() => {
    loadInitialData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only activate shortcuts if we're on a page with search functionality
      const hasSearchInput = document.querySelector('input[placeholder="Search roles..."]');
      if (!hasSearchInput) return;
      
      // Ctrl/Cmd + N to create new role
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleOpen();
      }
      // Ctrl/Cmd + F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search roles..."]') as HTMLInputElement;
        searchInput?.focus();
      }
      // Escape to close dialogs
      if (event.key === 'Escape') {
        if (open) handleClose();
        if (viewModalOpen) setViewModalOpen(false);
        if (deleteModalOpen) setDeleteModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, viewModalOpen, deleteModalOpen]);

  const fuzzyResults = useMemo(() => {
    if (!searchInput) return roles.map((r: Role, i: number) => ({ item: r, refIndex: i }));
    return fuse.search(searchInput);
  }, [searchInput, fuse, roles]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    let filtered = fuzzyResults.map((r: any) => r.item);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(role => role.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [fuzzyResults, statusFilter, sortField, sortOrder]);

  // Paginated roles with memoization for performance
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRoles.slice(start, end);
  }, [filteredRoles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const isAllSelected = paginatedRoles.length > 0 && paginatedRoles.every(r => selectedIds.includes(r.id));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRoles.map(r => r.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleOpen = (role: Role | null = null) => {
    // Check if user can manage the role
    if (role && !canManageRole(role)) {
      toast.error(`You cannot ${role ? 'edit' : 'create'} this role. Insufficient permissions.`);
      return;
    }
    
    // Check if user can create roles
    if (!role && !canCreateRole()) {
      toast.error('You cannot create new roles. Insufficient permissions.');
      return;
    }
    
    setEditRole(role);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditRole(null);
  };

  const handleSave = () => {
    if (!editRole) return; // Should not happen if handleOpen is called correctly

    setRoles(roles.map(r => r.id === editRole.id ? { 
      ...editRole, 
      status: editRole.status,
      totalUsers: editRole.totalUsers,
      createdAt: editRole.createdAt,
      updatedAt: new Date().toISOString()
    } : r));
    toast.success('Role updated successfully');
    handleClose();
  };

  const handleDelete = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (!role) return;
    
    // Check if user can manage this role
    if (!canManageRole(role)) {
      toast.error('You cannot delete this role. Insufficient permissions.');
      return;
    }
    
    if (role.totalUsers > 0) {
      toast.error('Cannot delete role with assigned users');
      return;
    }
    
    setRoles(roles.filter(r => r.id !== id));
    toast.success('Role deleted successfully');
  };

  const handlePermissionChange = (perm: string) => {
    // This function is no longer needed as RoleForm handles permissions
  };

  const handleSort = (field: string) => {
    setSortField((prevField) => {
      const isSameField = prevField === field;
      const newOrder = isSameField && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder as RoleSortOrder);
      return field as RoleSortField;
    });
  };

  const handleColumnToggle = (columnAccessor: string, checked: boolean) => {
    setVisibleColumns(prev => {
      if (checked) {
        return prev.includes(columnAccessor) ? prev : [...prev, columnAccessor];
      } else {
        if (COLUMN_OPTIONS.find(col => col.accessor === columnAccessor)?.required) return prev;
        return prev.filter(col => col !== columnAccessor);
      }
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(roleColumns.map(col => col.key));
    toast.success('Column visibility reset to default');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fetchedRoles = await roleService.getAllRoles();
      setRoles(fetchedRoles);
      toast.success('Roles refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh roles:', err);
      toast.error('Failed to refresh roles');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Print handler for all roles
  const handlePrint = () => {
    const printColumns = roleColumns.map(col => ({ 
      header: col.label, 
      accessor: col.key 
    }));

    const printData = filteredRoles.map(role => ({
      name: role.name,
      description: role.description,
      permissions: `${role.permissions.length} permissions`,
      totalUsers: role.totalUsers.toString(),
      status: role.status,
    }));

    const printFunction = PrintLayout({
      title: 'Roles & Permissions List',
      data: printData,
      columns: printColumns,
      totalItems: filteredRoles.length,
    });

    printFunction();
    toast.success('Print dialog opened');
  };

  // Print handler for selected roles only
  const handlePrintSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('No roles selected for printing');
      return;
    }

    const selectedRolesData = roles.filter(role => selectedIds.includes(role.id));
    
    const printColumns = roleColumns.map(col => ({ 
      header: col.label, 
      accessor: col.key 
    }));

    const printData = selectedRolesData.map(role => ({
      name: role.name,
      description: role.description,
      permissions: `${role.permissions.length} permissions`,
      totalUsers: role.totalUsers.toString(),
      status: role.status,
    }));

    const printFunction = PrintLayout({
      title: `Selected Roles & Permissions (${selectedIds.length} items)`,
      data: printData,
      columns: printColumns,
      totalItems: selectedIds.length,
    });

    printFunction();
    toast.success(`Print dialog opened for ${selectedIds.length} selected roles`);
  };

  // Quick Export handler for selected roles as CSV
  const handleQuickExport = () => {
    if (selectedIds.length === 0) {
      toast.error('No roles selected for export');
      return;
    }

    const selectedRolesData = roles.filter(role => selectedIds.includes(role.id));
    
    // Define CSV headers and data
    const headers = ['Role Name', 'Description', 'Permissions Count', 'Total Users', 'Status', 'Created At', 'Updated At'];
    const rows = selectedRolesData.map(role => [
      role.name,
      role.description,
      role.permissions.length.toString(),
      role.totalUsers.toString(),
      role.status,
      new Date(role.createdAt).toLocaleDateString(),
      new Date(role.updatedAt).toLocaleDateString()
    ]);

    // Create CSV content
    const csvRows = [headers, ...rows];
    const csvContent = csvRows.map(row => 
      row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(",")
    ).join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `selected-roles-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    toast.success(`Successfully exported ${selectedIds.length} roles to CSV`);
  };

  // Table columns
  const columns: TableListColumn<Role>[] = [
    EXPANDER_COLUMN,
    {
      header: (
        <Checkbox 
          checked={isAllSelected} 
          indeterminate={isIndeterminate} 
          onCheckedChange={handleSelectAll}
          aria-label="Select all roles"
        />
      ),
      accessor: 'select',
      className: 'w-6 sm:w-8 text-center',
    },
    ...roleColumns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => {
        if (col.key === 'name') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: `${col.width || ''} text-center`,
            sortable: col.sortable,
            render: (item: Role) => (
              <div className="flex flex-col items-center gap-1">
                <div className="text-sm font-medium text-blue-900 text-center">
                  {item.name}
                </div>
                {!canManageRole(item) && (
                  <Badge variant="secondary" className="text-xs">
                    Protected
                  </Badge>
                )}
              </div>
            )
          };
        }
        if (col.key === 'description') {
          return {
            header: col.label,
            accessor: col.accessor,
            className: `${col.width || ''} text-center`,
            sortable: col.sortable,
            render: (item: Role) => (
              <span className="text-sm text-blue-900 text-center line-clamp-2">
                {item.description}
              </span>
            )
          };
        }
                         if (col.key === 'permissions') {
          return {
            header: <div className="text-center">{col.label}</div>,
            accessor: col.accessor,
            className: `${col.width || ''} text-center`,
            sortable: col.sortable,
            render: (item: Role) => (
              <div className="flex justify-center">
                <span className="text-sm text-blue-900 text-center">
                  {item.permissions.length} permissions
                </span>
              </div>
            )
          };
        }
        if (col.key === 'totalUsers') {
          return {
            header: <div className="text-center">{col.label}</div>,
            accessor: col.accessor,
            className: `${col.width || ''} text-center`,
            sortable: col.sortable,
            render: (item: Role) => (
              <span className="text-sm text-blue-900 text-center font-medium">
                {item.totalUsers}
              </span>
            )
          };
        }
        if (col.key === 'status') {
          return {
            header: <div className="text-center">{col.label}</div>,
            accessor: col.accessor,
            className: `${col.width || ''} text-center`,
            sortable: col.sortable,
            render: (item: Role) => (
              <Badge variant={item.status === "ACTIVE" ? "success" : item.status === "INACTIVE" ? "destructive" : "secondary"} className="text-center">
                {item.status.toUpperCase()}
              </Badge>
            )
          };
        }
        return {
          header: <div className="text-center">{col.label}</div>,
          accessor: col.accessor,
          className: `${col.width || ''} text-center`,
          sortable: col.sortable
        };
      }),
    {
      header: <div className="text-center">Actions</div>,
      accessor: "rowActions",
      className: "w-20 sm:w-24 md:w-28 lg:w-32 text-center",
              render: (item: Role) => (
          <div className="flex gap-1 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="View Role"
                  className="hover:bg-blue-50"
                  onClick={() => {
                    setSelectedRole(item);
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
                  aria-label="Edit Role"
                  className="hover:bg-green-50"
                  onClick={() => handleOpen(item)}
                  disabled={!canManageRole(item)}
                >
                  <Pencil className="h-4 w-4 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                {!canManageRole(item) ? "Cannot edit this role" : "Edit"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete Role"
                  className="hover:bg-red-50"
                  onClick={() => {
                    setSelectedRole(item);
                    setDeleteModalOpen(true);
                  }}
                  disabled={item.totalUsers > 0 || !canManageRole(item)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                {item.totalUsers > 0 ? "Cannot delete role with users" : 
                 !canManageRole(item) ? "Cannot delete this role" : "Delete"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-none px-2 sm:px-4 md:px-6 lg:px-8 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10">
        <PageHeader
          title="Roles & Permissions"
          subtitle="Manage user roles and their access permissions"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Settings", href: "/settings" },
            { label: "Roles & Permissions" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <SummaryCard
            icon={<Shield className="text-blue-500 w-5 h-5" />}
            label="Total Roles"
            value={roles.length}
            valueClassName="text-blue-900"
            sublabel="Total number of roles"
          />
          <SummaryCard
            icon={<UserCheck className="text-blue-500 w-5 h-5" />}
            label="Active Roles"
            value={roles.filter(r => r.status === 'ACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Currently active"
          />
          <SummaryCard
            icon={<UserX className="text-blue-500 w-5 h-5" />}
            label="Inactive Roles"
            value={roles.filter(r => r.status === 'INACTIVE').length}
            valueClassName="text-blue-900"
            sublabel="Inactive or archived"
          />
          <SummaryCard
            icon={<Users className="text-blue-500 w-5 h-5" />}
            label="Total Users"
            value={roles.reduce((sum, r) => sum + (r.totalUsers || 0), 0)}
            valueClassName="text-blue-900"
            sublabel="Total assigned users"
          />
        </div>



        {/* Quick Actions Panel */}
        <div className="w-full pt-2 sm:pt-4">
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
                id: 'add-role',
                label: 'Add Role',
                description: canCreateRole() ? 'Create new role' : 'Insufficient permissions',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => handleOpen(),
                disabled: !canCreateRole()
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import roles from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => setImportDialogOpen(true)
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
                description: 'Reload role data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: handleRefresh,
                disabled: isRefreshing,
                loading: isRefreshing
              },
              {
                id: 'sort-options',
                label: 'Sort Options',
                description: 'Configure sorting',
                icon: <List className="w-5 h-5 text-white" />,
                onClick: () => setSortDialogOpen(true)
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print roles list',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: handlePrint
              },

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
        <div className="w-full pt-2 sm:pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header */}
                             <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                 <div className="py-3 sm:py-4 md:py-6">
                   <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                                         <div>
                       <h3 className="text-base sm:text-lg font-bold text-white">Role List</h3>
                       <p className="text-blue-100 text-xs sm:text-sm">Search and filter role information</p>
                     </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Error State */}
            {error && (
              <div className="p-6 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-semibold text-red-800">Error Loading Data</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="ml-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-2 sm:p-3 md:p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 items-start lg:items-center justify-end">
                {/* Search Bar */}
                <div className="relative w-full lg:w-auto lg:min-w-[200px] lg:max-w-xs xl:max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-gray-500"
                    aria-label="Search roles by name or description"
                    aria-describedby="search-help"
                  />
                  <div id="search-help" className="sr-only">
                    Use Ctrl+F to quickly focus this search box
                  </div>
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-28 md:w-32 lg:w-28 text-gray-500 rounded">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

                         {/* Bulk Actions Bar */}
             {selectedIds.length > 0 && (
               <div className="mt-2 sm:mt-3 px-2 sm:px-3 md:px-4 lg:px-6">
                <BulkActionsBar
                  selectedCount={selectedIds.length}
                  entityLabel="role"
                  actions={[
                    {
                      key: "bulk-actions",
                      label: "Bulk Actions",
                      icon: <Settings className="w-4 h-4 mr-2" />,
                      onClick: () => {
                        const selectedRoles = roles.filter(role => selectedIds.includes(role.id));
                        setSelectedRolesForBulkAction(selectedRoles);
                        setBulkActionsDialogOpen(true);
                      },
                      tooltip: "Open enhanced bulk actions dialog with status updates, notifications, and exports",
                      variant: "default"
                    },
                    {
                      key: "export",
                      label: "Quick Export",
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: handleQuickExport,
                      tooltip: "Quick export selected roles to CSV",
                      variant: "outline"
                    },
                    {
                      key: "duplicate",
                      label: "Duplicate Selected",
                      icon: <FileText className="w-4 h-4 mr-2" />,
                      onClick: () => {
                        // TODO: Implement bulk duplicate functionality
                        console.log("Bulk duplicate not yet implemented");
                      },
                      tooltip: "Create copies of selected roles with modified names",
                      variant: "outline",
                      disabled: true // Disabled until implemented
                    },
                    {
                      key: "print",
                      label: "Print Selected",
                      icon: <Printer className="w-4 h-4 mr-2" />,
                      onClick: handlePrintSelected,
                      tooltip: "Print only selected roles",
                      variant: "outline"
                    }
                  ]}
                  onClear={() => setSelectedIds([])}
                />
                
                {/* Protected Roles Warning */}
                {selectedRolesForBulkAction?.some(role => role.name === 'Super Admin' || role.name === 'Admin') && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Protected roles (Super Admin, Admin) have restricted management capabilities for security reasons.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

                         {/* Table Content */}
             <div className="relative px-2 sm:px-3 md:px-4 lg:px-6 mt-2 sm:mt-3 md:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative w-full">
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {initialLoading ? (
                                       <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4">
                     <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                       <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
                       <span className="text-base sm:text-lg font-semibold text-blue-900">Loading roles...</span>
                     </div>
                     <p className="text-xs sm:text-sm text-blue-700 text-center">Please wait while we fetch the latest data</p>
                   </div>
                                     ) : !loading && filteredRoles.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4">
                      <EmptyState
                        icon={<Shield className="w-6 h-6 text-blue-400" />}
                        title="No roles found"
                        description="Try adjusting your search criteria or filters to find the roles you're looking for."
                        action={
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={handleRefresh}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Data
                            </Button>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <TableList
                      columns={columns}
                      data={paginatedRoles}
                      loading={loading}
                      selectedIds={selectedIds}
                      emptyMessage={null}
                      onSelectRow={handleSelectRow}
                      onSelectAll={handleSelectAll}
                      isAllSelected={isAllSelected}
                      isIndeterminate={isIndeterminate}
                      getItemId={(item) => item.id}
                      className="border-0 shadow-none w-full"
                      sortState={{ field: sortField, order: sortOrder }}
                      onSort={handleSort}
                      expandedRowIds={expandedRowIds}
                      onToggleExpand={(itemId) => {
                        setExpandedRowIds(current => 
                          current.includes(itemId) 
                            ? current.filter(id => id !== itemId)
                            : [...current, itemId]
                        );
                      }}
                    />
                  )}
                </div>
              </div>
              
                             {/* Mobile Card View */}
               <div className="block lg:hidden">
                <TableCardView
                  items={paginatedRoles}
                  selectedIds={selectedIds}
                  onSelect={handleSelectRow}
                  onView={(item) => {
                    setSelectedRole(item);
                    setViewModalOpen(true);
                  }}
                  onEdit={(item) => handleOpen(item)}
                  onDelete={(item) => {
                    setSelectedRole(item);
                    setDeleteModalOpen(true);
                  }}
                  getItemId={(item) => item.id}
                  getItemName={(item) => item.name}
                  getItemCode={(item) => item.id}
                  getItemStatus={(item) => item.status.toLowerCase() as 'active' | 'inactive'}
                  getItemDescription={(item) => item.description}
                  getItemDetails={(item) => [
                    { label: 'Permissions', value: `${item.permissions.length} permissions` },
                    { label: 'Users', value: item.totalUsers },
                    { label: 'Status', value: item.status },
                    { label: 'Created', value: new Date(item.createdAt).toLocaleDateString() },
                  ]}
                  disabled={(item) => item.totalUsers > 0 || !canManageRole(item)}
                  deleteTooltip={(item) => {
                    if (item.totalUsers > 0) return "Cannot delete role with assigned users";
                    if (!canManageRole(item)) return "Cannot delete this role";
                    return undefined;
                  }}
                  isLoading={loading}
                />
              </div>
              
              {/* Pagination */}
              <TablePagination
                page={currentPage}
                pageSize={itemsPerPage}
                totalItems={filteredRoles.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                entityLabel="role"
              />
            </div>
          </Card>
        </div>

        {/* Role Form Dialog */}
        <RoleForm
          open={open}
          onOpenChange={setOpen}
          type={editRole ? "update" : "create"}
          data={editRole ? {
            id: editRole.id,
            name: editRole.name,
            description: editRole.description,
            permissions: editRole.permissions,
            status: editRole.status,
            totalUsers: editRole.totalUsers,
            createdAt: editRole.createdAt,
            updatedAt: editRole.updatedAt,
          } : undefined}
          id={editRole?.id}
          onSuccess={async () => {
            // Refresh the roles list after successful creation/update
            setOpen(false);
            setEditRole(null);
            
            try {
              // Fetch updated roles from the API
              const updatedRoles = await roleService.getAllRoles();
              setRoles(updatedRoles);
              toast.success(editRole ? 'Role updated successfully' : 'Role created successfully');
            } catch (error) {
              console.error('Failed to refresh roles after creation/update:', error);
              toast.error('Role saved but failed to refresh the list');
            }
          }}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={deleteModalOpen}
          onOpenChange={(open) => {
            setDeleteModalOpen(open);
            if (!open) setSelectedRole(null);
          }}
          itemName={selectedRole?.name}
          onDelete={() => { 
            if (selectedRole) handleDelete(selectedRole.id); 
            setDeleteModalOpen(false);
          }}
          onCancel={() => { setDeleteModalOpen(false); setSelectedRole(null); }}
          canDelete={selectedRole ? selectedRole.totalUsers === 0 : false}
          deleteError={selectedRole && selectedRole.totalUsers > 0 ? "Cannot delete role with assigned users" : undefined}
          description={selectedRole ? `Are you sure you want to delete the role "${selectedRole.name}"? This action cannot be undone.` : undefined}
        />

        {/* View Role Dialog */}
        <ViewDialog
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedRole ? `${selectedRole.name}` : "Role Details"}
          subtitle={selectedRole?.description}
          status={selectedRole ? {
            value: selectedRole.status,
            variant: selectedRole.status === "ACTIVE" ? "success" : 
                    selectedRole.status === "INACTIVE" ? "destructive" : "secondary"
          } : undefined}
          headerVariant="default"
          showPrintButton={true}
          sections={selectedRole ? ([
            {
              title: "Role Information",
              fields: [
                { label: 'Role ID', value: String(selectedRole.id), icon: <Shield className="w-4 h-4 text-blue-600" /> },
                { label: 'Role Name', value: selectedRole.name, icon: <Shield className="w-4 h-4 text-blue-600" /> },
                { label: 'Description', value: selectedRole.description, icon: <FileText className="w-4 h-4 text-blue-600" /> },
                { label: 'Status', value: selectedRole.status, icon: <Info className="w-4 h-4 text-blue-600" /> },
                { label: 'Total Users', value: String(selectedRole.totalUsers), icon: <Users className="w-4 h-4 text-blue-600" /> },
              ]
            },
            {
              title: "Permissions",
              fields: selectedRole.permissions.map(perm => ({
                label: perm,
                value: 'Granted',
                icon: <UserCheck className="w-4 h-4 text-green-600" />
              }))
            },
            {
              title: "Timestamps",
              fields: [
                { label: 'Created At', value: selectedRole.createdAt, type: 'date', icon: <Clock className="w-4 h-4 text-blue-600" /> },
                { label: 'Last Updated', value: selectedRole.updatedAt, type: 'date', icon: <RefreshCw className="w-4 h-4 text-blue-600" /> },
              ]
            }
          ]) : []}
          tooltipText="View detailed role information"
        />

        {/* Sort Dialog */}
        <SortDialog
          open={sortDialogOpen}
          onOpenChange={setSortDialogOpen}
          sortOptions={roleSortFieldOptions}
          currentSort={{
            field: sortField,
            order: sortOrder
          }}
          onSortChange={(field: string, order: 'asc' | 'desc') => {
            setSortField(field as RoleSortField);
            setSortOrder(order);
          }}
          title="Sort Roles"
          description="Sort roles by different fields. Choose the field and order to organize your list."
          entityType="roles"
        />



        {/* Visible Columns Dialog */}
        <VisibleColumnsDialog
          open={visibleColumnsDialogOpen}
          onOpenChange={setVisibleColumnsDialogOpen}
          columns={COLUMN_OPTIONS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          onReset={handleResetColumns}
          title="Manage Role Columns"
          description="Choose which columns to display in the role table"
          searchPlaceholder="Search role columns..."
          enableManualSelection={true}
        />

        {/* Import Dialog */}
        <ImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={async (data) => {
            try {
              console.log('RolesPage: Import data received:', data);
              
              // Transform the data to match the API format
              const rolesData: BulkImportRoleData[] = data.map(record => ({
                roleName: record.roleName || '',
                roleDescription: record.roleDescription,
                rolePermissions: record.rolePermissions || [],
                roleStatus: record.roleStatus || 'ACTIVE'
              }));

              console.log('RolesPage: Transformed roles data:', rolesData);

              // Call the bulk import API
              const result = await roleService.bulkImportRoles(rolesData);
              
              console.log('RolesPage: Import result:', result);
              
              // Show success/error messages
              if (result.success > 0) {
                toast.success(`Successfully imported ${result.success} roles`);
                
                // Add the newly created roles to the local state
                if (result.createdRoles && result.createdRoles.length > 0) {
                  setRoles(prevRoles => [...prevRoles, ...result.createdRoles]);
                }
              }
              
              if (result.failed > 0) {
                toast.error(`Failed to import ${result.failed} roles. Check the details for more information.`);
              }

              // Refresh the roles list to get the latest data
              try {
                const updatedRoles = await roleService.getAllRoles();
                setRoles(updatedRoles);
              } catch (refreshError) {
                console.error('Failed to refresh roles after import:', refreshError);
                // If refresh fails, we still have the imported roles in state
              }
              
              setImportDialogOpen(false);
              return result;
            } catch (error) {
              console.error('RolesPage: Import error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to import roles';
              toast.error(errorMessage);
              setImportDialogOpen(false);
              return { success: 0, failed: data.length, errors: [errorMessage] };
            }
          }}
          entityName="Role"
          templateUrl={undefined}
          acceptedFileTypes={[".csv", ".xlsx", ".xls"]}
          maxFileSize={5}
          currentUserRole={currentUserRole}
        />

        {/* Bulk Actions Dialog */}
        <BulkActionsDialog
          open={bulkActionsDialogOpen}
          onOpenChange={setBulkActionsDialogOpen}
          selectedItems={selectedRolesForBulkAction}
          entityType="role"
          entityLabel="role"
          availableActions={[
            {
              id: 'status-update',
              label: 'Update Status',
              description: 'Change status of selected roles',
              icon: <Settings className="w-4 h-4" />,
              tabId: 'actions',
              requiresConfirmation: true,
              confirmationMessage: 'Are you sure you want to update the status of selected roles?'
            },
            {
              id: 'notification',
              label: 'Send Notification',
              description: 'Send notifications to role users',
              icon: <Bell className="w-4 h-4" />,
              tabId: 'actions',
              requiresConfirmation: true,
              confirmationMessage: 'Are you sure you want to send notifications to users with these roles?'
            },
            {
              id: 'export',
              label: 'Export Data',
              description: 'Export selected roles data',
              icon: <Download className="w-4 h-4" />,
              tabId: 'actions'
            }
          ]}
           onActionComplete={(actionType, results) => {
             console.log('Bulk action completed:', actionType, results);
             toast.success(`Bulk action completed: ${actionType}`);
             setBulkActionsDialogOpen(false);
             setSelectedRolesForBulkAction([]);
           }}
           onCancel={() => {
             setBulkActionsDialogOpen(false);
             setSelectedRolesForBulkAction([]);
           }}
           onProcessAction={async (actionType, config) => {
             console.log('Processing bulk action:', actionType, config);
             
             // Handle role-specific bulk actions
             if (actionType === 'bulk-actions' && config.actionType === 'role-bulk-actions') {
               console.log('Processing role bulk actions:', config);
               
               // Simulate API call for role bulk actions
               await new Promise(resolve => setTimeout(resolve, 1500));
               
               return { success: true, processed: selectedRolesForBulkAction.length };
             }
             
             // Handle other action types
             await new Promise(resolve => setTimeout(resolve, 1000));
             
             return { success: true, processed: selectedRolesForBulkAction.length };
           }}
           getItemId={(role: Role) => role.id}
           getItemDisplayName={(role: Role) => role.name}
           getItemStatus={(role: Role) => role.status}
         />


      </div>
    </div>
  );
}