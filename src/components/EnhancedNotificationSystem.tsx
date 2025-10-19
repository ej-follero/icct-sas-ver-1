import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Bell, 
  Mail, 
  Clock, 
  Users, 
  Send, 
  Settings, 
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { StudentAttendance } from '@/types/student-attendance';

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: 'email';
  subject: string;
  message: string;
  variables: string[];
  category: 'attendance' | 'general' | 'academic' | 'emergency';
  isDefault?: boolean;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  recipients: StudentAttendance[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledFor?: Date;
  sentAt?: Date;
  sentCount: number;
  totalCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  createdBy: string;
}

export interface NotificationSettings {
  enableEmail: boolean;
  
  enablePush: boolean;
  defaultPriority: 'low' | 'medium' | 'high';
  autoSendAttendanceAlerts: boolean;
  attendanceThreshold: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  rateLimit: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface EnhancedNotificationSystemProps {
  students: StudentAttendance[];
  onSendNotification: (notification: any) => Promise<void>;
  onSaveTemplate: (template: NotificationTemplate) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onScheduleCampaign: (campaign: Omit<NotificationCampaign, 'id' | 'status' | 'sentCount' | 'totalCount' | 'successCount' | 'failureCount' | 'createdAt'>) => Promise<void>;
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'attendance_reminder',
    name: 'Attendance Reminder',
    description: 'Gentle reminder about attendance',
    type: 'email',
    subject: 'Attendance Reminder - {student_name}',
    message: 'Dear {student_name},\n\nThis is a friendly reminder about your attendance record. Regular attendance is crucial for academic success.\n\nCurrent attendance rate: {attendance_rate}%\n\nBest regards,\nICCT Administration',
    variables: ['student_name', 'attendance_rate'],
    category: 'attendance',
    isDefault: true
  },
  {
    id: 'low_attendance_warning',
    name: 'Low Attendance Warning',
    description: 'Warning for students with low attendance',
    type: 'email',
    subject: 'Low Attendance Warning - {student_name}',
    message: 'Dear {student_name},\n\nWe have noticed that your attendance rate is below the required threshold.\n\nCurrent attendance rate: {attendance_rate}%\nRequired minimum: 75%\n\nPlease contact your advisor immediately to discuss this matter.\n\nBest regards,\nICCT Administration',
    variables: ['student_name', 'attendance_rate'],
    category: 'attendance',
    isDefault: true
  },
  {
    id: 'attendance_improvement',
    name: 'Attendance Improvement Notice',
    description: 'Positive feedback for improved attendance',
    type: 'email',
    subject: 'Great News! Attendance Improvement - {student_name}',
    message: 'Dear {student_name},\n\nExcellent work! Your attendance has improved significantly.\n\nCurrent attendance rate: {attendance_rate}%\n\nKeep up the great work!\n\nBest regards,\nICCT Administration',
    variables: ['student_name', 'attendance_rate'],
    category: 'attendance',
    isDefault: true
  },
  {
    id: 'emergency_alert',
    name: 'Emergency Alert',
    description: 'For urgent notifications',
    type: 'email',
    subject: 'URGENT: {subject}',
    message: 'URGENT NOTIFICATION\n\n{message}\n\nPlease take immediate action.\n\nBest regards,\nICCT Administration',
    variables: ['subject', 'message'],
    category: 'emergency',
    isDefault: true
  }
];

export function EnhancedNotificationSystem({
  students,
  onSendNotification,
  onSaveTemplate,
  onDeleteTemplate,
  onScheduleCampaign
}: EnhancedNotificationSystemProps) {
  // Validate props
  if (!onSendNotification || !onSaveTemplate || !onDeleteTemplate || !onScheduleCampaign) {
    console.error('EnhancedNotificationSystem: Missing required props');
    return null;
  }
  const [activeTab, setActiveTab] = useState('compose');
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_TEMPLATES);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableEmail: true,
    
    enablePush: false,
    defaultPriority: 'medium',
    autoSendAttendanceAlerts: true,
    attendanceThreshold: 75,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    rateLimit: {
      enabled: true,
      maxPerHour: 100,
      maxPerDay: 1000
    }
  });

  // Compose state
  const [composeData, setComposeData] = useState({
    templateId: '',
    type: 'email',
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    recipients: [] as StudentAttendance[],
    scheduleFor: '',
    immediate: true
  });

  // Template management state
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Campaign tracking state
  const [activeCampaigns, setActiveCampaigns] = useState<NotificationCampaign[]>([]);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time campaign updates
      setActiveCampaigns(prev => 
        prev.map(campaign => {
          if (campaign.status === 'sending' && campaign.sentCount < campaign.totalCount) {
            const newSentCount = Math.min(campaign.sentCount + Math.floor(Math.random() * 5) + 1, campaign.totalCount);
            const newSuccessCount = Math.floor(newSentCount * 0.95);
            const newFailureCount = newSentCount - newSuccessCount;
            
            return {
              ...campaign,
              sentCount: newSentCount,
              successCount: newSuccessCount,
              failureCount: newFailureCount,
              status: newSentCount >= campaign.totalCount ? 'completed' : 'sending'
            };
          }
          return campaign;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleTemplateSelect = useCallback((templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setComposeData(prev => ({
          ...prev,
          templateId,
          type: template.type,
          subject: template.subject,
          message: template.message
        }));
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      toast.error('Failed to select template');
    }
  }, [templates]);

  const handleSendNotification = useCallback(async () => {
    if (!composeData.subject || !composeData.message) {
      toast.error('Please fill in subject and message');
      return;
    }

    if (composeData.recipients.length === 0) {
      toast.error('Please select recipients');
      return;
    }

    try {
      const notification = {
        ...composeData,
        recipients: composeData.recipients.map(s => (s as any).id || s.studentId || s.studentName),
        scheduledFor: composeData.immediate ? undefined : new Date(composeData.scheduleFor)
      };

      await onSendNotification(notification);
      
      if (composeData.immediate) {
        toast.success(`Notification sent to ${composeData.recipients.length} recipients`);
      } else {
        toast.success(`Notification scheduled for ${composeData.scheduleFor}`);
      }

      // Reset compose form
      setComposeData({
        templateId: '',
        type: 'email',
        subject: '',
        message: '',
        priority: 'medium',
        recipients: [],
        scheduleFor: '',
        immediate: true
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  }, [composeData, onSendNotification]);

  const handleSaveTemplate = useCallback(async (template: NotificationTemplate) => {
    try {
      await onSaveTemplate(template);
      setTemplates(prev => {
        const existing = prev.find(t => t.id === template.id);
        if (existing) {
          return prev.map(t => t.id === template.id ? template : t);
        } else {
          return [...prev, template];
        }
      });
      setShowTemplateForm(false);
      setEditingTemplate(null);
      toast.success('Template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  }, [onSaveTemplate]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await onDeleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  }, [onDeleteTemplate]);

  const recipientStats = useMemo(() => {
    const total = composeData.recipients.length;
    const lowAttendance = composeData.recipients.filter(s => s.attendanceRate < 75).length;
    const highAttendance = composeData.recipients.filter(s => s.attendanceRate >= 90).length;
    const departments = [...new Set(composeData.recipients.map(s => s.department))];

    return { total, lowAttendance, highAttendance, departments };
  }, [composeData.recipients]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Notification System</h2>
          <p className="text-gray-600">Send notifications, manage templates, and track campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Active
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Users className="w-3 h-3 mr-1" />
            {students.length} Students
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Compose Notification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template">Template</Label>
                      <Select value={composeData.templateId} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                {template.type === 'email' && <Mail className="w-4 h-4" />}
                                
                                
                                {template.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={composeData.type} onValueChange={(value: any) => setComposeData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </div>
                          </SelectItem>


                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <input
                      type="text"
                      value={composeData.subject}
                      onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter subject..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      value={composeData.message}
                      onChange={(e) => setComposeData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter message..."
                      rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: {'{student_name}'}, {'{attendance_rate}'}, {'{department}'}, {'{course}'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={composeData.priority} onValueChange={(value: any) => setComposeData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="schedule">Schedule</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="immediate"
                          checked={composeData.immediate}
                          onCheckedChange={(checked) => setComposeData(prev => ({ ...prev, immediate: checked }))}
                        />
                        <Label htmlFor="immediate">Send immediately</Label>
                      </div>
                      {!composeData.immediate && (
                        <input
                          type="datetime-local"
                          value={composeData.scheduleFor}
                          onChange={(e) => setComposeData(prev => ({ ...prev, scheduleFor: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleSendNotification}
                    className="w-full"
                    disabled={!composeData.subject || !composeData.message || composeData.recipients.length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {composeData.immediate ? 'Send Notification' : 'Schedule Notification'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recipients Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Recipients
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selected: {recipientStats.total}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setComposeData(prev => ({ ...prev, recipients: [] }))}
                        disabled={recipientStats.total === 0}
                      >
                        Clear
                      </Button>
                    </div>
                    
                    {recipientStats.total > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span>{recipientStats.lowAttendance} low attendance</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{recipientStats.highAttendance} high attendance</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Departments: {recipientStats.departments.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Quick Selection</Label>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={useCallback(() => {
                          try {
                            const lowAttendance = students.filter(s => s.attendanceRate < 75);
                            setComposeData(prev => ({ ...prev, recipients: lowAttendance }));
                          } catch (error) {
                            console.error('Error selecting low attendance students:', error);
                            toast.error('Failed to select students');
                          }
                        }, [students])}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Low Attendance (&lt; 75%)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={useCallback(() => {
                          try {
                            const absent = students.filter(s => (s.status as string) === 'ABSENT' || (s.status as string) === 'absent');
                            setComposeData(prev => ({ ...prev, recipients: absent }));
                          } catch (error) {
                            console.error('Error selecting absent students:', error);
                            toast.error('Failed to select students');
                          }
                        }, [students])}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Currently Absent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={useCallback(() => {
                          try {
                            setComposeData(prev => ({ ...prev, recipients: students }));
                          } catch (error) {
                            console.error('Error selecting all students:', error);
                            toast.error('Failed to select students');
                          }
                        }, [students])}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        All Students
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.slice(0, 3).map(campaign => (
                      <div key={campaign.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-gray-500">{campaign.sentCount}/{campaign.totalCount} sent</p>
                        </div>
                        <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notification Templates</h3>
            <Button onClick={() => setShowTemplateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {template.type === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                      
                      
                      {template.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Subject</p>
                      <p className="text-sm">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Variables</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Use
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {!template.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notification Campaigns</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {campaigns.filter(c => c.status === 'sending').length} Active
              </Badge>
              <Badge variant="outline">
                {campaigns.filter(c => c.status === 'completed').length} Completed
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">{campaign.description}</p>
                    </div>
                    <Badge variant={
                      campaign.status === 'completed' ? 'default' :
                      campaign.status === 'sending' ? 'secondary' :
                      campaign.status === 'failed' ? 'destructive' :
                      'outline'
                    }>
                      {campaign.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Progress</p>
                      <p className="font-semibold">{campaign.sentCount}/{campaign.totalCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Success</p>
                      <p className="font-semibold text-green-600">{campaign.successCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Failed</p>
                      <p className="font-semibold text-red-600">{campaign.failureCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="font-semibold">
                        {campaign.sentCount > 0 ? Math.round((campaign.successCount / campaign.sentCount) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {campaign.status === 'sending' && (
                    <Progress value={(campaign.sentCount / campaign.totalCount) * 100} className="mb-4" />
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created by {campaign.createdBy}</span>
                    <span>{campaign.createdAt.toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {campaigns.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600">Create your first notification campaign to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Notification Channels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable-email">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Send notifications via email</p>
                    </div>
                    <Switch
                      id="enable-email"
                      checked={settings.enableEmail}
                      onCheckedChange={(checked) => {
                        try {
                          setSettings(prev => ({ ...prev, enableEmail: checked }));
                        } catch (error) {
                          console.error('Error updating email setting:', error);
                          toast.error('Failed to update email setting');
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable-push">Push Notifications</Label>
                      <p className="text-sm text-gray-500">Send push notifications to mobile app</p>
                    </div>
                    <Switch
                      id="enable-push"
                      checked={settings.enablePush}
                      onCheckedChange={(checked) => {
                        try {
                          setSettings(prev => ({ ...prev, enablePush: checked }));
                        } catch (error) {
                          console.error('Error updating push setting:', error);
                          toast.error('Failed to update push setting');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Automation</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-send">Auto-send Attendance Alerts</Label>
                      <p className="text-sm text-gray-500">Automatically send alerts for low attendance</p>
                    </div>
                    <Switch
                      id="auto-send"
                      checked={settings.autoSendAttendanceAlerts}
                      onCheckedChange={(checked) => {
                        try {
                          setSettings(prev => ({ ...prev, autoSendAttendanceAlerts: checked }));
                        } catch (error) {
                          console.error('Error updating auto-send setting:', error);
                          toast.error('Failed to update auto-send setting');
                        }
                      }}
                    />
                  </div>
                  {settings.autoSendAttendanceAlerts && (
                    <div>
                      <Label htmlFor="threshold">Attendance Threshold (%)</Label>
                      <input
                        type="number"
                        id="threshold"
                        value={settings.attendanceThreshold}
                        onChange={(e) => {
                          try {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value < 0 || value > 100) {
                              toast.error('Please enter a valid threshold between 0 and 100');
                              return;
                            }
                            setSettings(prev => ({ ...prev, attendanceThreshold: value }));
                          } catch (error) {
                            console.error('Error updating threshold:', error);
                            toast.error('Failed to update threshold');
                          }
                        }}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Rate Limiting</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="rate-limit">Enable Rate Limiting</Label>
                      <p className="text-sm text-gray-500">Limit notifications per hour/day</p>
                    </div>
                    <Switch
                      id="rate-limit"
                      checked={settings.rateLimit.enabled}
                      onCheckedChange={(checked) => {
                        try {
                          setSettings(prev => ({ 
                            ...prev, 
                            rateLimit: { ...prev.rateLimit, enabled: checked }
                          }));
                        } catch (error) {
                          console.error('Error updating rate limit setting:', error);
                          toast.error('Failed to update rate limit setting');
                        }
                      }}
                    />
                  </div>
                  {settings.rateLimit.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="max-hour">Max per Hour</Label>
                        <input
                          type="number"
                          id="max-hour"
                          value={settings.rateLimit.maxPerHour}
                          onChange={(e) => {
                            try {
                              const value = parseInt(e.target.value);
                              if (isNaN(value) || value < 1) {
                                toast.error('Please enter a valid number greater than 0');
                                return;
                              }
                              setSettings(prev => ({ 
                                ...prev, 
                                rateLimit: { ...prev.rateLimit, maxPerHour: value }
                              }));
                            } catch (error) {
                              console.error('Error updating max per hour:', error);
                              toast.error('Failed to update max per hour');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-day">Max per Day</Label>
                        <input
                          type="number"
                          id="max-day"
                          value={settings.rateLimit.maxPerDay}
                          onChange={(e) => {
                            try {
                              const value = parseInt(e.target.value);
                              if (isNaN(value) || value < 1) {
                                toast.error('Please enter a valid number greater than 0');
                                return;
                              }
                              setSettings(prev => ({ 
                                ...prev, 
                                rateLimit: { ...prev.rateLimit, maxPerDay: value }
                              }));
                            } catch (error) {
                              console.error('Error updating max per day:', error);
                              toast.error('Failed to update max per day');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                className="w-full"
                onClick={() => {
                  try {
                    // Here you would typically save settings to a backend
                    toast.success('Settings saved successfully');
                  } catch (error) {
                    console.error('Error saving settings:', error);
                    toast.error('Failed to save settings');
                  }
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 