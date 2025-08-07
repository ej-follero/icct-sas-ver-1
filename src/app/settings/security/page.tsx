"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Save,
  RefreshCw,
  Users,
  Activity,
  FileText,
  Settings,
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  Info,
  Search,
  Plus,
  Download,
  Upload,
  Printer,
  Columns3,
  List,
  Bell,
  Building2,
  RotateCcw,
  Eye as EyeIcon,
  Pencil,
  BookOpen,
  GraduationCap,
  BadgeInfo,
  X,
  ChevronRight,
  Hash,
  Tag,
  Layers,
  UserCheck as UserCheckIcon,
  Archive,
  AlertOctagon,
  ShieldX
} from "lucide-react";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface SecuritySettings {
  // Password Policy
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  
  // Session Management
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  forceLogoutOnPasswordChange: boolean;
  
  // Two-Factor Authentication
  twoFactorEnabled: boolean;
  twoFactorMethod: "EMAIL" | "APP";
  backupCodesEnabled: boolean;
  
  // Login Security
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  
  // Audit & Monitoring
  auditLoggingEnabled: boolean;
  loginNotificationsEnabled: boolean;
  suspiciousActivityAlerts: boolean;
  
  // Advanced Security
  sslEnforcement: boolean;
  apiRateLimiting: boolean;
  dataEncryptionAtRest: boolean;
}

export default function SecurityPage() {
  const { user, hasPermission, isSuperAdmin, isAdmin, isDepartmentHead, isSystemAuditor, loading, isInitialized } = useUser();
  const router = useRouter();

  // All useState hooks must be called before any conditional logic
  const [settings, setSettings] = useState<SecuritySettings>({
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    maxConcurrentSessions: 3,
    forceLogoutOnPasswordChange: true,
    twoFactorEnabled: true,
    twoFactorMethod: "APP",
    backupCodesEnabled: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    ipWhitelistEnabled: false,
    ipWhitelist: [],
    auditLoggingEnabled: true,
    loginNotificationsEnabled: true,
    suspiciousActivityAlerts: true,
    sslEnforcement: true,
    apiRateLimiting: true,
    dataEncryptionAtRest: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newIpAddress, setNewIpAddress] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Role-based access control
  const canAccessSecuritySettings = () => {
    if (loading || !isInitialized) return false;
    return isSuperAdmin || isAdmin || hasPermission('Security Settings');
  };

  const canManageAdvancedSecurity = () => {
    return isSuperAdmin || isAdmin;
  };

  const canManageSystemSecurity = () => {
    return isSuperAdmin;
  };

  const canViewSecurityLogs = () => {
    return isSuperAdmin || isAdmin || isSystemAuditor || hasPermission('Audit Logs');
  };

  const canManageEmergencyAccess = () => {
    return isSuperAdmin;
  };

  const canManageDatabaseSecurity = () => {
    return isSuperAdmin || isAdmin;
  };

  // Redirect if no access - only after initialization
  useEffect(() => {
    if (isInitialized && !canAccessSecuritySettings()) {
      toast.error("You don't have permission to access security settings");
      router.push('/dashboard');
    }
  }, [isInitialized, user, router]);

  // Show loading state only during initial load
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
        <main className="flex-1 pt-0 p-6">
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
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
        </main>
      </div>
    );
  }

  // Show access denied if no permission
  if (!canAccessSecuritySettings()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
        <main className="flex-1 pt-0 p-6">
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <ShieldX className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Access Denied</h3>
                      <p className="text-red-100 text-sm">You don't have permission to access security settings</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <AlertOctagon className="w-16 h-16 text-red-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-gray-900">Security Settings Access Restricted</h3>
                  <p className="text-gray-600">
                    You do not have the required permissions to access security settings. 
                    Please contact your system administrator if you believe this is an error.
                  </p>
                  <div className="flex justify-center gap-4 mt-6">
                    <Button onClick={() => router.push('/dashboard')}>
                      Return to Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/settings')}>
                      Settings Home
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Mock security status data
  const securityStatus = {
    overallScore: 85,
    lastScan: "2024-01-15T10:30:00Z",
    vulnerabilities: 2,
    recommendations: 5,
    activeSessions: 12,
    failedAttempts: 3,
    suspiciousActivities: 1,
  };

  // Calculate security metrics
  const securityMetrics = {
    totalUsers: 1250,
    activeSessions: securityStatus.activeSessions,
    failedAttempts: securityStatus.failedAttempts,
    suspiciousActivities: securityStatus.suspiciousActivities,
    enabledFeatures: [
      settings.twoFactorEnabled ? 1 : 0,
      settings.auditLoggingEnabled ? 1 : 0,
      settings.sslEnforcement ? 1 : 0,
      settings.apiRateLimiting ? 1 : 0,
      settings.dataEncryptionAtRest ? 1 : 0,
    ].reduce((sum, val) => sum + val, 0)
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Security settings updated successfully");
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddIpAddress = () => {
    if (newIpAddress && !settings.ipWhitelist.includes(newIpAddress)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIpAddress]
      }));
      setNewIpAddress("");
      toast.success("IP address added to whitelist");
    }
  };

  const handleRemoveIpAddress = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(addr => addr !== ip)
    }));
    toast.success("IP address removed from whitelist");
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Security data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh security data");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <main className="flex-1 pt-0 p-6">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          <PageHeader
            title="Security Settings"
            subtitle="Configure system security policies and monitoring"
            breadcrumbs={[
              { label: "Home", href: "/" },
              { label: "Settings", href: "/settings" },
              { label: "Security" }
            ]}
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <SummaryCard
              icon={<Shield className="text-blue-500 w-5 h-5" />}
              label="Security Score"
              value={`${securityStatus.overallScore}%`}
              valueClassName={getSecurityScoreColor(securityStatus.overallScore)}
              sublabel="Overall security rating"
            />
            <SummaryCard
              icon={<Users className="text-blue-500 w-5 h-5" />}
              label="Active Sessions"
              value={securityMetrics.activeSessions}
              valueClassName="text-blue-900"
              sublabel="Currently active users"
            />
            <SummaryCard
              icon={<AlertTriangle className="text-blue-500 w-5 h-5" />}
              label="Failed Attempts"
              value={securityMetrics.failedAttempts}
              valueClassName="text-red-600"
              sublabel="Recent failed logins"
            />
            <SummaryCard
              icon={<ShieldCheck className="text-blue-500 w-5 h-5" />}
              label="Security Features"
              value={securityMetrics.enabledFeatures}
              valueClassName="text-green-600"
              sublabel="Enabled security features"
            />
          </div>

          {/* Quick Actions and Recent Activity - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions Panel */}
            <div className="w-full">
              <QuickActionsPanel
                variant="premium"
                title="Security Quick Actions"
                subtitle={`Essential security tools and shortcuts - ${isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrator' : 'Limited Access'}`}
                icon={
                  <div className="w-6 h-6 text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                }
                actionCards={[
                  {
                    id: 'refresh-security',
                    label: 'Refresh Data',
                    description: 'Reload security data',
                    icon: isRefreshing ? (
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-white" />
                    ),
                    onClick: handleRefreshData,
                    disabled: isRefreshing,
                    loading: isRefreshing
                  },
                  {
                    id: 'export-security',
                    label: 'Export Settings',
                    description: 'Export security configuration',
                    icon: <Download className="w-5 h-5 text-white" />,
                    onClick: () => toast.info("Export functionality coming soon"),
                    disabled: !canManageAdvancedSecurity()
                  },
                  {
                    id: 'print-security',
                    label: 'Print Report',
                    description: 'Print security report',
                    icon: <Printer className="w-5 h-5 text-white" />,
                    onClick: () => toast.info("Print functionality coming soon")
                  },
                  {
                    id: 'backup-settings',
                    label: 'Backup Settings',
                    description: 'Create settings backup',
                    icon: <Upload className="w-5 h-5 text-white" />,
                    onClick: () => toast.info("Backup functionality coming soon"),
                    disabled: !canManageAdvancedSecurity()
                  },
                  {
                    id: 'security-audit',
                    label: 'Run Audit',
                    description: 'Perform security audit',
                    icon: <ShieldCheck className="w-5 h-5 text-white" />,
                    onClick: () => toast.info("Audit functionality coming soon"),
                    disabled: !canManageAdvancedSecurity()
                  },
                  {
                    id: 'view-logs',
                    label: 'View Logs',
                    description: 'Access security logs',
                    icon: <FileText className="w-5 h-5 text-white" />,
                    onClick: () => toast.info("Logs functionality coming soon"),
                    disabled: !canViewSecurityLogs()
                  }
                ]}
                lastActionTime="5 minutes ago"
                onLastActionTimeChange={() => {}}
                collapsible={true}
                defaultCollapsed={true}
                onCollapseChange={(collapsed) => {
                  console.log('Security Quick Actions Panel collapsed:', collapsed);
                }}
              />
            </div>

            {/* Recent Activity */}
            <Card className="shadow-lg rounded-xl overflow-hidden p-0">
              <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                      <p className="text-blue-100 text-sm">Security events and alerts</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed Login Attempts</span>
                  <Badge variant="destructive">{securityStatus.failedAttempts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Suspicious Activities</span>
                  <Badge variant="warning">{securityStatus.suspiciousActivities}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Security Scan</span>
                  <span className="text-xs text-gray-500">
                    {new Date(securityStatus.lastScan).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Overview */}
          <Card className="shadow-lg rounded-xl overflow-hidden p-0">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
              <div className="py-4 sm:py-6">
                <div className="flex items-center gap-3 px-4 sm:px-6">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Security Overview</h3>
                    <p className="text-blue-100 text-sm">Current security status and recommendations</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getSecurityScoreColor(securityStatus.overallScore)}`}>
                    {securityStatus.overallScore}%
                  </div>
                  <div className="text-sm text-gray-600">Security Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {securityStatus.vulnerabilities}
                  </div>
                  <div className="text-sm text-gray-600">Vulnerabilities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {securityStatus.recommendations}
                  </div>
                  <div className="text-sm text-gray-600">Recommendations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {securityStatus.activeSessions}
                  </div>
                  <div className="text-sm text-gray-600">Active Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings Tabs */}
          <Card className="shadow-lg rounded-xl overflow-hidden p-0">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
              <div className="py-4 sm:py-6">
                <div className="flex items-center gap-3 px-4 sm:px-6">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Security Configuration</h3>
                    <p className="text-blue-100 text-sm">
                      {isSuperAdmin ? "Full system security configuration" : 
                       isAdmin ? "General security settings management" : 
                       "Limited security settings access"}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger value="session" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Session
                  </TabsTrigger>
                  <TabsTrigger value="2fa" className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    2FA
                  </TabsTrigger>
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="advanced" 
                    className="flex items-center gap-2"
                    disabled={!canManageAdvancedSecurity()}
                  >
                    <Settings className="w-4 h-4" />
                    Advanced
                    {!canManageAdvancedSecurity() && (
                      <Badge variant="secondary" className="ml-1 text-xs">Admin+</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Password Policy Tab */}
                <TabsContent value="password" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password Policy</CardTitle>
                      <CardDescription>
                        Configure password requirements and expiration policies
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="minLength">Minimum Password Length</Label>
                            <Input
                              id="minLength"
                              type="number"
                              value={settings.minPasswordLength}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                minPasswordLength: parseInt(e.target.value)
                              }))}
                              min="6"
                              max="32"
                              disabled={!canManageAdvancedSecurity()}
                            />
                            {!canManageAdvancedSecurity() && (
                              <p className="text-xs text-gray-500 mt-1">Requires administrator privileges</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="expiryDays">Password Expiry (days)</Label>
                            <Input
                              id="expiryDays"
                              type="number"
                              value={settings.passwordExpiryDays}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                passwordExpiryDays: parseInt(e.target.value)
                              }))}
                              min="30"
                              max="365"
                              disabled={!canManageAdvancedSecurity()}
                            />
                            {!canManageAdvancedSecurity() && (
                              <p className="text-xs text-gray-500 mt-1">Requires administrator privileges</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="uppercase">Require Uppercase Letters</Label>
                            <Switch
                              id="uppercase"
                              checked={settings.requireUppercase}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                requireUppercase: checked
                              }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="lowercase">Require Lowercase Letters</Label>
                            <Switch
                              id="lowercase"
                              checked={settings.requireLowercase}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                requireLowercase: checked
                              }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="numbers">Require Numbers</Label>
                            <Switch
                              id="numbers"
                              checked={settings.requireNumbers}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                requireNumbers: checked
                              }))}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="special">Require Special Characters</Label>
                            <Switch
                              id="special"
                              checked={settings.requireSpecialChars}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                requireSpecialChars: checked
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Session Management Tab */}
                <TabsContent value="session" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Session Management</CardTitle>
                      <CardDescription>
                        Configure session timeout and concurrent session limits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="timeout">Session Timeout (minutes)</Label>
                          <Input
                            id="timeout"
                            type="number"
                            value={settings.sessionTimeoutMinutes}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              sessionTimeoutMinutes: parseInt(e.target.value)
                            }))}
                            min="5"
                            max="480"
                          />
                        </div>
                        <div>
                          <Label htmlFor="concurrent">Max Concurrent Sessions</Label>
                          <Input
                            id="concurrent"
                            type="number"
                            value={settings.maxConcurrentSessions}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              maxConcurrentSessions: parseInt(e.target.value)
                            }))}
                            min="1"
                            max="10"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="forceLogout">Force Logout on Password Change</Label>
                        <Switch
                          id="forceLogout"
                          checked={settings.forceLogoutOnPasswordChange}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            forceLogoutOnPasswordChange: checked
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Two-Factor Authentication Tab */}
                <TabsContent value="2fa" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>
                        Configure 2FA settings and backup options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="2faEnabled">Enable Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-600">Require 2FA for all users</p>
                        </div>
                        <Switch
                          id="2faEnabled"
                          checked={settings.twoFactorEnabled}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            twoFactorEnabled: checked
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="2faMethod">2FA Method</Label>
                        <Select
                          value={settings.twoFactorMethod}
                          onValueChange={(value) => setSettings(prev => ({
                            ...prev,
                            twoFactorMethod: value as "EMAIL" | "APP"
                          }))}
                        >
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue placeholder="Select 2FA method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APP">Authenticator App</SelectItem>
                            
                            <SelectItem value="EMAIL">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="backupCodes">Enable Backup Codes</Label>
                          <p className="text-sm text-gray-600">Allow users to generate backup codes</p>
                        </div>
                        <Switch
                          id="backupCodes"
                          checked={settings.backupCodesEnabled}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            backupCodesEnabled: checked
                          }))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Login Security Tab */}
                <TabsContent value="login" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Login Security</CardTitle>
                      <CardDescription>
                        Configure login attempt limits and IP restrictions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                          <Input
                            id="maxAttempts"
                            type="number"
                            value={settings.maxLoginAttempts}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              maxLoginAttempts: parseInt(e.target.value)
                            }))}
                            min="3"
                            max="10"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                          <Input
                            id="lockoutDuration"
                            type="number"
                            value={settings.lockoutDurationMinutes}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              lockoutDurationMinutes: parseInt(e.target.value)
                            }))}
                            min="5"
                            max="1440"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="ipWhitelist">Enable IP Whitelist</Label>
                          <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
                        </div>
                        <Switch
                          id="ipWhitelist"
                          checked={settings.ipWhitelistEnabled}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            ipWhitelistEnabled: checked
                          }))}
                        />
                      </div>

                      {settings.ipWhitelistEnabled && (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter IP address (e.g., 192.168.1.1)"
                              value={newIpAddress}
                              onChange={(e) => setNewIpAddress(e.target.value)}
                            />
                            <Button onClick={handleAddIpAddress}>Add</Button>
                          </div>
                          <div className="space-y-2">
                            {settings.ipWhitelist.map((ip, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{ip}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveIpAddress(ip)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Security Tab */}
                <TabsContent value="advanced" className="space-y-6 mt-6">
                  {!canManageAdvancedSecurity() ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldX className="w-5 h-5 text-red-500" />
                          Access Restricted
                        </CardTitle>
                        <CardDescription>
                          Advanced security settings require administrator privileges
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Alert>
                          <AlertOctagon className="h-4 w-4" />
                          <AlertDescription>
                            You need administrator privileges to access advanced security settings. 
                            Please contact your system administrator for assistance.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Advanced Security</CardTitle>
                        <CardDescription>
                          Configure advanced security features and monitoring
                          {!isSuperAdmin && (
                            <span className="block text-sm text-amber-600 mt-1">
                              Note: Some system-level settings are restricted to Super Administrators
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="auditLogging">Enable Audit Logging</Label>
                              <p className="text-sm text-gray-600">Log all security-related activities</p>
                            </div>
                            <Switch
                              id="auditLogging"
                              checked={settings.auditLoggingEnabled}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                auditLoggingEnabled: checked
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="loginNotifications">Login Notifications</Label>
                              <p className="text-sm text-gray-600">Send notifications for new logins</p>
                            </div>
                            <Switch
                              id="loginNotifications"
                              checked={settings.loginNotificationsEnabled}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                loginNotificationsEnabled: checked
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="suspiciousAlerts">Suspicious Activity Alerts</Label>
                              <p className="text-sm text-gray-600">Alert on suspicious login patterns</p>
                            </div>
                            <Switch
                              id="suspiciousAlerts"
                              checked={settings.suspiciousActivityAlerts}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                suspiciousActivityAlerts: checked
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="sslEnforcement">SSL Enforcement</Label>
                              <p className="text-sm text-gray-600">Require HTTPS for all connections</p>
                            </div>
                            <Switch
                              id="sslEnforcement"
                              checked={settings.sslEnforcement}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                sslEnforcement: checked
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="rateLimiting">API Rate Limiting</Label>
                              <p className="text-sm text-gray-600">Limit API requests to prevent abuse</p>
                            </div>
                            <Switch
                              id="rateLimiting"
                              checked={settings.apiRateLimiting}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                apiRateLimiting: checked
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="dataEncryption">Data Encryption at Rest</Label>
                              <p className="text-sm text-gray-600">Encrypt stored data</p>
                            </div>
                            <Switch
                              id="dataEncryption"
                              checked={settings.dataEncryptionAtRest}
                              onCheckedChange={(checked) => setSettings(prev => ({
                                ...prev,
                                dataEncryptionAtRest: checked
                              }))}
                            />
                          </div>

                          {/* Super Admin Only Features */}
                          {isSuperAdmin && (
                            <>
                              <Separator />
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium text-sm text-blue-600">Super Administrator Features</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="emergencyAccess">Emergency Access</Label>
                                    <p className="text-sm text-gray-600">Enable emergency system access protocols</p>
                                  </div>
                                  <Switch
                                    id="emergencyAccess"
                                    checked={true}
                                    disabled={true}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="databaseAdmin">Database Administration</Label>
                                    <p className="text-sm text-gray-600">Direct database security management</p>
                                  </div>
                                  <Switch
                                    id="databaseAdmin"
                                    checked={true}
                                    disabled={true}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor="systemOverride">System Configuration Override</Label>
                                    <p className="text-sm text-gray-600">Override system security configurations</p>
                                  </div>
                                  <Switch
                                    id="systemOverride"
                                    checked={true}
                                    disabled={true}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Security Recommendations */}
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] p-0">
              <div className="py-4 sm:py-6">
                <div className="flex items-center gap-3 px-4 sm:px-6">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Security Recommendations</h3>
                    <p className="text-yellow-100 text-sm">Important security suggestions</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Enable two-factor authentication for all users to add an extra layer of security.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Consider reducing the session timeout to 15 minutes for enhanced security.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Enable suspicious activity alerts to monitor for potential security threats.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 