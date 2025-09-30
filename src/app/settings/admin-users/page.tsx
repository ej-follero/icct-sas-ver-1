"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
  department?: string;
  phone?: string;
}

export default function AdminUsersPage() {
  const { user, isSuperAdmin, isAdmin, loading } = useUser();
  const router = useRouter();
  
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (loading) return;
    
    if (!isSuperAdmin && !isAdmin) {
      toast.error("You don't have permission to access this page");
      router.push('/dashboard');
      return;
    }
    
    fetchAdminUsers();
  }, [loading, user, router]);

  const fetchAdminUsers = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API call
      // const response = await fetch('/api/admin-users');
      // const data = await response.json();
      
      // Mock data for now
      const mockUsers: AdminUser[] = [
        {
          id: '1',
          name: 'John Admin',
          email: 'john.admin@icct.edu.ph',
          role: 'SUPER_ADMIN',
          status: 'active',
          lastLogin: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          permissions: ['User Management', 'System Settings', 'Security Settings'],
          department: 'IT Department',
          phone: '+63 912 345 6789'
        },
        {
          id: '2',
          name: 'Jane Admin',
          email: 'jane.admin@icct.edu.ph',
          role: 'ADMIN',
          status: 'active',
          lastLogin: '2024-01-15T09:15:00Z',
          createdAt: '2024-01-05T00:00:00Z',
          permissions: ['User Management', 'Role Management'],
          department: 'Academic Affairs',
          phone: '+63 912 345 6790'
        },
        {
          id: '3',
          name: 'Bob Department Head',
          email: 'bob.head@icct.edu.ph',
          role: 'DEPARTMENT_HEAD',
          status: 'active',
          lastLogin: '2024-01-14T16:45:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          permissions: ['User Management'],
          department: 'Computer Science',
          phone: '+63 912 345 6791'
        }
      ];
      
      setAdminUsers(mockUsers);
      
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === adminUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(adminUsers.map(user => user.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Admin</Badge>;
      case 'DEPARTMENT_HEAD':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Dept Head</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const adminUserColumns: TableListColumn<AdminUser>[] = [
    {
      header: "",
      accessor: "select" as const,
      width: 20,
      minWidth: 20,
      render: (user: AdminUser) => null // Will be handled by TableList
    },
    {
      header: "Name",
      accessor: "name" as const,
      width: 200,
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: "Role",
      accessor: "role" as const,
      width: 120,
      render: (user: AdminUser) => (
        <div className="text-center">
          {getRoleBadge(user.role)}
        </div>
      )
    },
    {
      header: "Status",
      accessor: "status" as const,
      width: 100,
      render: (user: AdminUser) => (
        <div className="text-center">
          {getStatusBadge(user.status)}
        </div>
      )
    },
    {
      header: "Department",
      accessor: "department" as const,
      width: 150,
      render: (user: AdminUser) => (
        <div className="text-center">
          <div className="text-sm text-gray-700">{user.department || 'N/A'}</div>
        </div>
      )
    },
    {
      header: "Last Login",
      accessor: "lastLogin" as const,
      width: 150,
      render: (user: AdminUser) => (
        <div className="text-center">
          <div className="text-sm text-gray-700">
            {new Date(user.lastLogin).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(user.lastLogin).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      header: "Actions",
      accessor: "actions" as const,
      width: 60,
      render: (user: AdminUser) => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => toast.info('View user details')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info('Edit user')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Edit className="w-4 h-4 text-green-600" />
                <span>Edit User</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info('Toggle user status')}
                className="flex items-center gap-2 cursor-pointer"
              >
                {user.status === 'active' ? (
                  <>
                    <Lock className="w-4 h-4 text-orange-600" />
                    <span>Suspend User</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-green-600" />
                    <span>Activate User</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const filteredUsers = adminUsers.filter(user => {
    const matchesSearch = !searchInput || 
      user.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      user.email.toLowerCase().includes(searchInput.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelected = selectedIds.length === adminUsers.length && adminUsers.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < adminUsers.length;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-6 py-4">
        <PageHeader
          title="Admin Users"
          subtitle="Manage administrative users and their permissions"
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Admin Users" }
          ]}
        />
      </div>

      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Users className="text-blue-500 w-5 h-5" />}
            label="Total Admins"
            value={adminUsers.length}
            valueClassName="text-blue-900"
            sublabel="Administrative users"
          />
          <SummaryCard
            icon={<Shield className="text-green-500 w-5 h-5" />}
            label="Active Users"
            value={adminUsers.filter(u => u.status === 'active').length}
            valueClassName="text-green-900"
            sublabel="Currently active"
          />
          <SummaryCard
            icon={<UserPlus className="text-purple-500 w-5 h-5" />}
            label="Super Admins"
            value={adminUsers.filter(u => u.role === 'SUPER_ADMIN').length}
            valueClassName="text-purple-900"
            sublabel="Super administrators"
          />
          <SummaryCard
            icon={<Calendar className="text-orange-500 w-5 h-5" />}
            label="Recent Logins"
            value={adminUsers.filter(u => {
              const lastLogin = new Date(u.lastLogin);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              return lastLogin > yesterday;
            }).length}
            valueClassName="text-orange-900"
            sublabel="Last 24 hours"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsPanel
          variant="premium"
          title="Admin User Management"
          subtitle="Manage administrative users and permissions"
          icon={<Users className="w-6 h-6 text-white" />}
          actionCards={[
            {
              id: 'refresh-data',
              label: 'Refresh Data',
              description: 'Reload admin users',
              icon: <RefreshCw className="w-5 h-5 text-white" />,
              onClick: fetchAdminUsers
            },
            {
              id: 'add-admin',
              label: 'Add Admin User',
              description: 'Create new admin user',
              icon: <UserPlus className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Add admin user functionality coming soon')
            },
            {
              id: 'bulk-actions',
              label: 'Bulk Actions',
              description: 'Manage selected users',
              icon: <MoreHorizontal className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Bulk actions coming soon'),
              disabled: selectedIds.length === 0
            }
          ]}
          lastActionTime="2 minutes ago"
          onLastActionTimeChange={() => {}}
          collapsible={true}
          defaultCollapsed={true}
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search admin users..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DEPARTMENT_HEAD">Dept Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Admin Users Table */}
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Administrative Users</CardTitle>
                <p className="text-blue-100 text-sm">Manage admin users and their permissions</p>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {adminUsers.length} users
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TableList
              columns={adminUserColumns}
              data={paginatedUsers}
              loading={isLoading}
              selectedIds={selectedIds}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              getItemId={(item) => item.id}
              className="border-0 shadow-none"
            />
            <TablePagination
              page={currentPage}
              pageSize={itemsPerPage}
              totalItems={filteredUsers.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={setItemsPerPage}
              entityLabel="admin user"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
