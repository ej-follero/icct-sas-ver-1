"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Users, 
  Lock, 
  Key, 
  Eye, 
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw
} from "lucide-react";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

// Type definitions
interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: number;
  name: string;
  permissions: number[];
  userCount: number;
}

interface AccessRule {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  rules: string[];
}

export default function AccessControlPage() {
  const { user, isSuperAdmin, isAdmin, loading } = useUser();
  const router = useRouter();
  
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!isSuperAdmin && !isAdmin) {
      toast.error("You don't have permission to access this page");
      router.push('/dashboard');
      return;
    }
    
    fetchAccessControlData();
  }, [loading, user, router]);

  const fetchAccessControlData = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API calls
      const [permissionsRes, rolesRes, rulesRes] = await Promise.all([
        fetch('/api/access-control/permissions'),
        fetch('/api/access-control/roles'),
        fetch('/api/access-control/rules')
      ]);
      
      // Mock data for now
      setPermissions([
        { id: 1, name: 'User Management', description: 'Manage user accounts', category: 'Users' },
        { id: 2, name: 'Role Management', description: 'Manage user roles', category: 'Users' },
        { id: 3, name: 'System Settings', description: 'Configure system settings', category: 'System' },
        { id: 4, name: 'Security Settings', description: 'Manage security policies', category: 'Security' },
        { id: 5, name: 'Audit Logs', description: 'View audit logs', category: 'Security' }
      ]);
      
      setRoles([
        { id: 1, name: 'Super Admin', permissions: [1, 2, 3, 4, 5], userCount: 2 },
        { id: 2, name: 'Admin', permissions: [1, 2, 3], userCount: 5 },
        { id: 3, name: 'Department Head', permissions: [1], userCount: 10 }
      ]);
      
      setAccessRules([
        { id: 1, name: 'IP Whitelist', type: 'IP_RESTRICTION', isActive: true, rules: ['192.168.1.0/24'] },
        { id: 2, name: 'Time-based Access', type: 'TIME_RESTRICTION', isActive: false, rules: ['09:00-17:00'] }
      ]);
      
    } catch (error) {
      console.error('Error fetching access control data:', error);
      toast.error('Failed to load access control data');
    } finally {
      setIsLoading(false);
    }
  };

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
          title="Access Control"
          subtitle="Manage permissions, roles, and access rules"
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Access Control" }
          ]}
        />
      </div>

      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Shield className="text-blue-500 w-5 h-5" />}
            label="Total Permissions"
            value={permissions.length}
            valueClassName="text-blue-900"
            sublabel="Available permissions"
          />
          <SummaryCard
            icon={<Users className="text-blue-500 w-5 h-5" />}
            label="Active Roles"
            value={roles.length}
            valueClassName="text-blue-900"
            sublabel="User roles"
          />
          <SummaryCard
            icon={<Lock className="text-blue-500 w-5 h-5" />}
            label="Access Rules"
            value={accessRules.length}
            valueClassName="text-blue-900"
            sublabel="Security rules"
          />
          <SummaryCard
            icon={<Key className="text-blue-500 w-5 h-5" />}
            label="Active Users"
            value={roles.reduce((sum, role) => sum + role.userCount, 0)}
            valueClassName="text-blue-900"
            sublabel="Total users"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsPanel
          variant="premium"
          title="Access Control Actions"
          subtitle="Manage permissions and access rules"
          icon={<Shield className="w-6 h-6 text-white" />}
          actionCards={[
            {
              id: 'refresh-data',
              label: 'Refresh Data',
              description: 'Reload access control data',
              icon: <RefreshCw className="w-5 h-5 text-white" />,
              onClick: fetchAccessControlData
            },
            {
              id: 'create-role',
              label: 'Create Role',
              description: 'Add new user role',
              icon: <Plus className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Create role functionality coming soon')
            },
            {
              id: 'manage-permissions',
              label: 'Manage Permissions',
              description: 'Configure system permissions',
              icon: <Key className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Permission management coming soon')
            }
          ]}
          lastActionTime="2 minutes ago"
          onLastActionTimeChange={() => {}}
          collapsible={true}
          defaultCollapsed={true}
        />

        {/* Main Content */}
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle>Access Control Management</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="permissions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="rules">Access Rules</TabsTrigger>
              </TabsList>

              <TabsContent value="permissions" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {permissions.map((permission) => (
                    <Card key={permission.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{permission.name}</h3>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                          <Badge variant="secondary" className="mt-1">
                            {permission.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="roles" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {roles.map((role) => (
                    <Card key={role.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{role.name}</h3>
                          <p className="text-sm text-gray-600">
                            {role.permissions.length} permissions • {role.userCount} users
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {accessRules.map((rule) => (
                    <Card key={rule.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{rule.name}</h3>
                          <p className="text-sm text-gray-600">
                            Type: {rule.type} • Status: {rule.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={rule.isActive} />
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
