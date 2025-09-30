"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Settings,
  Key,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit,
  Camera,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  LogOut,
  RefreshCw
} from "lucide-react";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface UserProfile {
  userId: number;
  userName: string;
  email: string;
  role: string;
  status: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  department?: string;
  position?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    failedLoginAttempts: number;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
  activity: {
    totalLogins: number;
    lastActivity: string;
    sessionsCount: number;
  };
}

export default function ProfilePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      toast.error("Please log in to view your profile");
      router.push('/login');
      return;
    }
    
    fetchUserProfile();
  }, [loading, user, router]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API call
      // const response = await fetch('/api/profile');
      // const data = await response.json();
      
      // Mock data for now
      const mockProfile: UserProfile = {
        userId: user?.userId || 1,
        userName: user?.userName || 'John Admin',
        email: user?.email || 'john.admin@icct.edu.ph',
        role: user?.role || 'ADMIN',
        status: 'ACTIVE',
        firstName: 'John',
        lastName: 'Admin',
        phoneNumber: '+63 912 345 6789',
        address: '123 Admin Street, Quezon City, Philippines',
        avatar: '/api/placeholder/150/150',
        bio: 'System Administrator with 5+ years of experience in managing educational systems.',
        department: 'Information Technology',
        position: 'System Administrator',
        lastLogin: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        preferences: {
          notifications: true,
          emailAlerts: true,
          darkMode: false,
          language: 'en',
          timezone: 'Asia/Manila'
        },
        security: {
          twoFactorEnabled: false,
          lastPasswordChange: '2024-01-15T00:00:00Z',
          failedLoginAttempts: 0,
          isEmailVerified: true,
          isPhoneVerified: false
        },
        activity: {
          totalLogins: 156,
          lastActivity: new Date().toISOString(),
          sessionsCount: 3
        }
      };
      
      setProfile(mockProfile);
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement real API call
      // await fetch('/api/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profile)
      // });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsSaving(true);
      // TODO: Implement real API call
      // await fetch('/api/profile/password', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ currentPassword, newPassword })
      // });
      
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      toast.success('Password changed successfully');
      
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      // TODO: Implement real file upload
      // const formData = new FormData();
      // formData.append('avatar', file);
      // const response = await fetch('/api/profile/avatar', {
      //   method: 'POST',
      //   body: formData
      // });
      
      toast.success('Avatar updated successfully');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'SUSPENDED':
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
      case 'INSTRUCTOR':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Instructor</Badge>;
      case 'STUDENT':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Student</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
          <Button onClick={fetchUserProfile}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-6 py-4">
        <PageHeader
          title="My Profile"
          subtitle="Manage your account settings and personal information"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Profile" }
          ]}
        />
      </div>

      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<User className="text-blue-500 w-5 h-5" />}
            label="Account Status"
            value={profile.status}
            valueClassName="text-blue-900"
            sublabel="Current status"
          />
          <SummaryCard
            icon={<Shield className="text-green-500 w-5 h-5" />}
            label="Security Level"
            value={profile.security.twoFactorEnabled ? "High" : "Standard"}
            valueClassName="text-green-900"
            sublabel="Account security"
          />
          <SummaryCard
            icon={<Activity className="text-purple-500 w-5 h-5" />}
            label="Total Logins"
            value={profile.activity.totalLogins.toString()}
            valueClassName="text-purple-900"
            sublabel="Login count"
          />
          <SummaryCard
            icon={<Clock className="text-orange-500 w-5 h-5" />}
            label="Last Activity"
            value={new Date(profile.activity.lastActivity).toLocaleDateString()}
            valueClassName="text-orange-900"
            sublabel="Recent activity"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsPanel
          variant="premium"
          title="Profile Actions"
          subtitle="Manage your account and settings"
          icon={<User className="w-6 h-6 text-white" />}
          actionCards={[
            {
              id: 'edit-profile',
              label: 'Edit Profile',
              description: 'Update personal information',
              icon: <Edit className="w-5 h-5 text-white" />,
              onClick: () => setIsEditing(!isEditing)
            },
            {
              id: 'change-password',
              label: 'Change Password',
              description: 'Update your password',
              icon: <Key className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Password change form available below')
            },
            {
              id: 'upload-avatar',
              label: 'Upload Avatar',
              description: 'Change profile picture',
              icon: <Camera className="w-5 h-5 text-white" />,
              onClick: () => document.getElementById('avatar-upload')?.click()
            },
            {
              id: 'export-data',
              label: 'Export Data',
              description: 'Download your data',
              icon: <Download className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Export functionality coming soon')
            }
          ]}
          lastActionTime="5 minutes ago"
          onLastActionTimeChange={() => {}}
          collapsible={true}
          defaultCollapsed={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white">
                    <AvatarImage src={profile.avatar} alt={profile.userName} />
                    <AvatarFallback className="text-2xl font-bold">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-blue-600 hover:bg-gray-100"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadAvatar(file);
                    }}
                  />
                </div>
                <CardTitle className="text-xl">{profile.userName}</CardTitle>
                <p className="text-blue-100">{profile.email}</p>
                <div className="flex justify-center gap-2 mt-2">
                  {getRoleBadge(profile.role)}
                  {getStatusBadge(profile.status)}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{profile.department}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Last login {new Date(profile.lastLogin || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {profile.bio && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                      <p className="text-sm text-gray-600">{profile.bio}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                          disabled={!isEditing}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                          disabled={!isEditing}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profile.phoneNumber || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)}
                          disabled={!isEditing}
                          className="mt-2"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={profile.address || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                          disabled={!isEditing}
                          className="mt-2"
                          rows={3}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profile.bio || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                          disabled={!isEditing}
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6 mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Switch
                          checked={profile.security.twoFactorEnabled}
                          onCheckedChange={(checked) => setProfile(prev => prev ? {
                            ...prev,
                            security: { ...prev.security, twoFactorEnabled: checked }
                          } : null)}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Change Password</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="mt-2 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                          <Button onClick={handleChangePassword} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Changing...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4 mr-2" />
                                Change Password
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4" />
                            <span className="font-semibold">Email Verification</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.security.isEmailVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            )}
                            <span className="text-sm">
                              {profile.security.isEmailVerified ? 'Verified' : 'Not Verified'}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4" />
                            <span className="font-semibold">Phone Verification</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.security.isPhoneVerified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            )}
                            <span className="text-sm">
                              {profile.security.isPhoneVerified ? 'Verified' : 'Not Verified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-6 mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Receive email alerts and updates</p>
                        </div>
                        <Switch
                          checked={profile.preferences.notifications}
                          onCheckedChange={(checked) => setProfile(prev => prev ? {
                            ...prev,
                            preferences: { ...prev.preferences, notifications: checked }
                          } : null)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Email Alerts</h4>
                          <p className="text-sm text-gray-600">Get notified about important events</p>
                        </div>
                        <Switch
                          checked={profile.preferences.emailAlerts}
                          onCheckedChange={(checked) => setProfile(prev => prev ? {
                            ...prev,
                            preferences: { ...prev.preferences, emailAlerts: checked }
                          } : null)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Dark Mode</h4>
                          <p className="text-sm text-gray-600">Use dark theme for the interface</p>
                        </div>
                        <Switch
                          checked={profile.preferences.darkMode}
                          onCheckedChange={(checked) => setProfile(prev => prev ? {
                            ...prev,
                            preferences: { ...prev.preferences, darkMode: checked }
                          } : null)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-6 mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">{profile.activity.totalLogins}</div>
                          <div className="text-sm text-gray-600">Total Logins</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{profile.activity.sessionsCount}</div>
                          <div className="text-sm text-gray-600">Active Sessions</div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {profile.security.failedLoginAttempts}
                          </div>
                          <div className="text-sm text-gray-600">Failed Attempts</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Recent Activity</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Activity className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="font-medium">Profile Updated</div>
                              <div className="text-sm text-gray-600">
                                {new Date(profile.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <LogOut className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-medium">Last Login</div>
                              <div className="text-sm text-gray-600">
                                {new Date(profile.lastLogin || '').toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Lock className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="font-medium">Password Changed</div>
                              <div className="text-sm text-gray-600">
                                {new Date(profile.security.lastPasswordChange).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {isEditing && (
                  <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
