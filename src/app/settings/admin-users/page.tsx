"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, UserCheck, UserX, Key, Search, UserPlus, RefreshCw, Eye, Pencil, Lock, Unlock, Settings, Plus, Trash2, Printer, Loader2, MoreHorizontal, Upload, List, Columns3, ChevronDown, ChevronUp, Bell, Building2, RotateCcw, Archive, Download, Hash, Tag, Layers, FileText, Clock, Info, Users, UserCheck as UserCheckIcon, X, ChevronRight, Crown, UserCog, HeadphonesIcon, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import SummaryCard from '@/components/SummaryCard';
import PageHeader from '@/components/PageHeader/PageHeader';
import Navbar from "@/components/Navbar";
import Menu from "@/components/Menu";
import AdminUserForm from "@/components/forms/AdminUserForm";
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';
import { EmptyState } from '@/components/reusable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from '@/hooks/use-debounce';
import Fuse from "fuse.js";

// Updated role types based on schema
type AdminUserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING" | "BLOCKED";
type AdminUserRole = "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_HEAD" | "SYSTEM_AUDITOR";

interface AdminUser {
  id: string;
  userName: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  fullName: string;
  lastLogin?: string;
  failedLoginAttempts: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  sessionVersion: number;
  permissions: string[];
  department?: string;
}

// Role configuration based on hierarchy recommendations
const ROLE_CONFIG = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Highest level of system access with all permissions",
    icon: <Crown className="w-4 h-4 text-yellow-600" />,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    permissions: ["All system permissions", "Emergency access", "Super admin management"]
  },
  ADMIN: {
    label: "Admin",
    description: "General administrative tasks and oversight",
    icon: <Shield className="w-4 h-4 text-blue-600" />,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    permissions: ["User management", "Department management", "System monitoring"]
  },
  DEPARTMENT_HEAD: {
    label: "Department Head",
    description: "Department-specific administration and oversight",
    icon: <Building2 className="w-4 h-4 text-green-600" />,
    color: "bg-green-100 text-green-800 border-green-200",
    permissions: ["Department-specific management", "Instructor oversight", "Department reports"]
  },
  SYSTEM_AUDITOR: {
    label: "System Auditor",
    description: "Compliance and audit functions",
    icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    permissions: ["Read-only access", "Audit logs", "Compliance reporting"]
  }
};

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch admin users data
  const fetchAdminUsers = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch('/api/admin-users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { data: adminUsersData } = await response.json();
      setAdminUsers(adminUsersData);
      
      if (refresh) toast.success('Admin users refreshed successfully');
    } catch (err) {
      console.error('Error fetching admin users:', err);
      toast.error('Failed to load admin users. Please try again later.');
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Activate admin user
  const handleActivate = async (user: AdminUser) => {
    try {
      const response = await fetch('/api/admin-users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'ACTIVE'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate user');
      }

      // Update local state
      setAdminUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: "ACTIVE" as AdminUserStatus } : u
      ));
      toast.success('Admin user activated successfully');
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to activate admin user');
    }
  };

  // Suspend admin user
  const handleSuspend = async (user: AdminUser) => {
    try {
      const response = await fetch('/api/admin-users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          status: 'SUSPENDED'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to suspend user');
      }

      // Update local state
      setAdminUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: "SUSPENDED" as AdminUserStatus } : u
      ));
      toast.success("Admin user suspended successfully");
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to suspend admin user');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAdminUsers();
  }, []);

  // Enhanced search with Fuse.js
  const fuse = useMemo(() => new Fuse(adminUsers, {
    keys: ["userName", "email", "fullName", "role"],
    threshold: 0.4,
    includeMatches: true,
  }), [adminUsers]);

  const fuzzyResults = useMemo(() => {
    if (!searchInput) return adminUsers.map((user, i) => ({ item: user, refIndex: i }));
    return fuse.search(searchInput);
  }, [searchInput, fuse, adminUsers]);

  // Enhanced filtering with multiple criteria
  const filteredUsers = useMemo(() => {
    let filtered = fuzzyResults.map(r => r.item);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    return filtered;
  }, [fuzzyResults, statusFilter, roleFilter]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Selection management
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <Navbar 
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
        role="admin"
      />
      <main className="flex-1 pt-0 p-2">
          <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 space-y-6 sm:space-y-8">
            <PageHeader
              title="Admin Users"
              subtitle="Manage administrative users and their permissions"
              breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Settings", href: "/settings" },
                { label: "Admin Users" }
              ]}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <SummaryCard
                icon={<Shield className="text-blue-500 w-5 h-5" />}
                label="Total Admin Users"
                value={adminUsers.length}
                valueClassName="text-blue-900"
                sublabel="Total number of admin users"
              />
              <SummaryCard
                icon={<UserCheck className="text-blue-500 w-5 h-5" />}
                label="Active Users"
                value={adminUsers.filter(u => u.status === 'ACTIVE').length}
                valueClassName="text-blue-900"
                sublabel="Currently active"
              />
              <SummaryCard
                icon={<UserX className="text-blue-500 w-5 h-5" />}
                label="Suspended Users"
                value={adminUsers.filter(u => u.status === 'SUSPENDED' || u.status === 'BLOCKED').length}
                valueClassName="text-blue-900"
                sublabel="Suspended or blocked"
              />
              <SummaryCard
                icon={<Key className="text-blue-500 w-5 h-5" />}
                label="2FA Enabled"
                value={adminUsers.filter(u => u.twoFactorEnabled).length}
                valueClassName="text-blue-900"
                sublabel="Users with 2FA"
              />
            </div>



            {/* Quick Actions Panel */}
            <div className="w-full max-w-full pt-4">
              <QuickActionsPanel
                variant="premium"
                title="Quick Actions"
                subtitle="Essential admin user management tools"
                icon={
                  <div className="w-6 h-6 text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                }
                actionCards={[
                  {
                    id: 'add-admin',
                    label: 'Add Admin User',
                    description: 'Create new admin user',
                    icon: <UserPlus className="w-5 h-5 text-white" />,
                    onClick: () => setShowAddForm(true)
                  },
                  {
                    id: 'refresh-data',
                    label: 'Refresh Data',
                    description: 'Reload admin user data',
                    icon: isRefreshing ? (
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-white" />
                    ),
                    onClick: () => fetchAdminUsers(true),
                    disabled: isRefreshing,
                    loading: isRefreshing
                  },
                  {
                    id: 'bulk-actions',
                    label: 'Bulk Actions',
                    description: 'Manage multiple users',
                    icon: <Settings className="w-5 h-5 text-white" />,
                    onClick: () => {/* TODO: Implement bulk actions dialog */},
                    disabled: selectedIds.length === 0
                  },
                  {
                    id: 'export-data',
                    label: 'Export Data',
                    description: 'Export admin user data',
                    icon: <Download className="w-5 h-5 text-white" />,
                    onClick: () => {/* TODO: Implement export functionality */}
                  },
                  {
                    id: 'print-page',
                    label: 'Print Page',
                    description: 'Print admin user list',
                    icon: <Printer className="w-5 h-5 text-white" />,
                    onClick: () => window.print()
                  },
                  {
                    id: 'system-audit',
                    label: 'System Audit',
                    description: 'View system audit logs',
                    icon: <FileText className="w-5 h-5 text-white" />,
                    onClick: () => {/* TODO: Navigate to audit logs */}
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
                      <div className="flex items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Admin Users List</h3>
                            <p className="text-blue-100 text-sm">Search and filter admin user information</p>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                                 {/* Search and Filter Section */}
                 <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
                   <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center">
                     {/* Search Bar */}
                     <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                       <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                       <input
                         type="text"
                         placeholder="Search admin users..."
                         value={searchInput}
                         onChange={e => setSearchInput(e.target.value)}
                         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                       />
                     </div>
                     {/* Quick Filter Dropdowns */}
                     <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto xl:ml-auto">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="ACTIVE">
                            <span className="flex items-center gap-2">
                              <span className="text-green-600"><UserCheck className="w-4 h-4" /></span> Active
                            </span>
                          </SelectItem>
                          <SelectItem value="SUSPENDED">
                            <span className="flex items-center gap-2">
                              <span className="text-red-500"><Lock className="w-4 h-4" /></span> Suspended
                            </span>
                          </SelectItem>
                          <SelectItem value="INACTIVE">
                            <span className="flex items-center gap-2">
                              <span className="text-gray-500"><UserX className="w-4 h-4" /></span> Inactive
                            </span>
                          </SelectItem>
                          <SelectItem value="BLOCKED">
                            <span className="flex items-center gap-2">
                              <span className="text-red-600"><X className="w-4 h-4" /></span> Blocked
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="SUPER_ADMIN">
                            <span className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-yellow-600" />
                              Super Admin
                            </span>
                          </SelectItem>
                          <SelectItem value="ADMIN">
                            <span className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              Admin
                            </span>
                          </SelectItem>
                          <SelectItem value="DEPARTMENT_HEAD">
                            <span className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-green-600" />
                              Department Head
                            </span>
                          </SelectItem>
                          <SelectItem value="SYSTEM_AUDITOR">
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-purple-600" />
                              System Auditor
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
                      entityLabel="admin user"
                      actions={[
                        {
                          key: "bulk-activate",
                          label: "Activate Selected",
                          icon: <Unlock className="w-4 h-4 mr-2" />,
                          onClick: () => {/* TODO: Implement bulk activate */},
                          tooltip: "Activate selected admin users",
                          variant: "default"
                        },
                        {
                          key: "bulk-suspend",
                          label: "Suspend Selected",
                          icon: <Lock className="w-4 h-4 mr-2" />,
                          onClick: () => {/* TODO: Implement bulk suspend */},
                          tooltip: "Suspend selected admin users",
                          variant: "destructive"
                        },
                        {
                          key: "export-selected",
                          label: "Export Selected",
                          icon: <Download className="w-4 h-4 mr-2" />,
                          onClick: () => {/* TODO: Implement export selected */},
                          tooltip: "Export selected admin users data"
                        }
                      ]}
                      onClear={() => setSelectedIds([])}
                    />
                  </div>
                )}

                {/* Table Content */}
                <div className="relative px-2 sm:px-3 lg:px-4 mt-2 sm:mt-3 lg:mt-4">
                  <div className="overflow-x-auto bg-white/70 shadow-none relative">
                    {/* Loader overlay when refreshing */}
                    {isRefreshing && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                      </div>
                    )}
                    <div className="print-content">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                          <EmptyState
                            icon={<Shield className="w-6 h-6 text-blue-400" />}
                            title="No admin users found"
                            description="Try adjusting your search criteria or filters to find the admin users you're looking for."
                            action={
                              <div className="flex flex-col gap-2 w-full">
                                <Button
                                  onClick={() => setShowAddForm(true)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Add Admin User
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                                  onClick={() => fetchAdminUsers(true)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Refresh Data
                                </Button>
                              </div>
                            }
                          />
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  <Checkbox 
                                    checked={isAllSelected} 
                                    indeterminate={isIndeterminate} 
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all admin users"
                                  />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Last Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  2FA
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paginatedUsers.map((user) => {
                                const roleConfig = ROLE_CONFIG[user.role];
                                return (
                                  <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Checkbox 
                                        checked={selectedIds.includes(user.id)}
                                        onCheckedChange={() => handleSelectRow(user.id)}
                                        aria-label={`Select ${user.userName}`}
                                      />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-blue-600" />
                                          </div>
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {user.fullName}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {user.userName} • {user.email}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Badge className={`${roleConfig.color} border`}>
                                              <span className="flex items-center gap-1">
                                                {roleConfig.icon}
                                                {roleConfig.label}
                                              </span>
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-sm">{roleConfig.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              Permissions: {roleConfig.permissions.join(', ')}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Badge variant={
                                        user.status === "ACTIVE" ? "success" : 
                                        user.status === "INACTIVE" ? "destructive" : 
                                        user.status === "SUSPENDED" ? "secondary" : 
                                        user.status === "PENDING" ? "warning" : "destructive"
                                      }>
                                        {user.status.toUpperCase()}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Badge variant={user.twoFactorEnabled ? "success" : "secondary"}>
                                        {user.twoFactorEnabled ? "ENABLED" : "DISABLED"}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {/* View user details */}}
                                        >
                                          <Eye className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {/* Edit user */}}
                                        >
                                          <Pencil className="h-4 w-4 text-green-600" />
                                        </Button>
                                        {user.status === "SUSPENDED" || user.status === "BLOCKED" ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleActivate(user)}
                                          >
                                            <Unlock className="h-4 w-4 text-green-600" />
                                          </Button>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSuspend(user)}
                                          >
                                            <Lock className="h-4 w-4 text-red-600" />
                                          </Button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
        
        {/* Admin User Form Modal */}
        <AdminUserForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            fetchAdminUsers(true);
            setShowAddForm(false);
          }}
        />
      </div>
    );
} 