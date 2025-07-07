import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Bell, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Mail,
  MessageSquare,
  Settings,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { StudentAttendance } from '@/types/student-attendance';

export interface BulkActionConfig {
  type: 'status-update' | 'notification' | 'export' | 'custom';
  title: string;
  description: string;
  icon: React.ReactNode;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudents: StudentAttendance[];
  onActionComplete: (actionType: string, results: any) => void;
  onCancel: () => void;
}

export interface BulkStatusUpdate {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  date: string;
  reason?: string;
  notifyStudents?: boolean;
  notifyParents?: boolean;
}

export interface BulkNotification {
  type: 'email' | 'sms' | 'both';
  subject: string;
  message: string;
  template?: string;
  priority: 'low' | 'medium' | 'high';
  scheduleFor?: string;
}

export interface BulkExportConfig {
  format: 'csv' | 'excel' | 'pdf';
  columns: string[];
  includeHeaders: boolean;
  dateRange?: { start: string; end: string };
  filters?: Record<string, any>;
}

const BULK_ACTIONS: BulkActionConfig[] = [
  {
    type: 'status-update',
    title: 'Update Attendance Status',
    description: 'Mark selected students as present, absent, late, or excused',
    icon: <CheckCircle className="w-5 h-5" />,
    requiresConfirmation: true,
    confirmationMessage: 'This will update attendance records for all selected students. Continue?'
  },
  {
    type: 'notification',
    title: 'Send Notifications',
    description: 'Send email or SMS notifications to students and parents',
    icon: <Bell className="w-5 h-5" />,
    requiresConfirmation: true,
    confirmationMessage: 'This will send notifications to all selected students. Continue?'
  },
  {
    type: 'export',
    title: 'Export Data',
    description: 'Export selected students data in various formats',
    icon: <Download className="w-5 h-5" />,
    requiresConfirmation: false
  }
];

const NOTIFICATION_TEMPLATES = [
  {
    id: 'attendance_reminder',
    name: 'Attendance Reminder',
    subject: 'Attendance Reminder - {student_name}',
    message: 'Dear {student_name},\n\nThis is a reminder about your attendance record. Please ensure regular attendance to maintain academic progress.\n\nBest regards,\nICCT Administration'
  },
  {
    id: 'low_attendance_warning',
    name: 'Low Attendance Warning',
    subject: 'Low Attendance Warning - {student_name}',
    message: 'Dear {student_name},\n\nWe have noticed that your attendance rate is below the required threshold. Please contact your advisor to discuss this matter.\n\nCurrent attendance rate: {attendance_rate}%\n\nBest regards,\nICCT Administration'
  },
  {
    id: 'improvement_notice',
    name: 'Attendance Improvement Notice',
    subject: 'Attendance Improvement Notice - {student_name}',
    message: 'Dear {student_name},\n\nGreat news! Your attendance has improved significantly. Keep up the good work!\n\nCurrent attendance rate: {attendance_rate}%\n\nBest regards,\nICCT Administration'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    subject: '',
    message: ''
  }
];

const EXPORT_COLUMNS = [
  { id: 'studentId', label: 'Student ID', default: true },
  { id: 'studentName', label: 'Student Name', default: true },
  { id: 'department', label: 'Department', default: true },
  { id: 'course', label: 'Course', default: true },
  { id: 'yearLevel', label: 'Year Level', default: true },
  { id: 'attendanceRate', label: 'Attendance Rate', default: true },
  { id: 'presentDays', label: 'Present Days', default: false },
  { id: 'absentDays', label: 'Absent Days', default: false },
  { id: 'lateDays', label: 'Late Days', default: false },
  { id: 'totalDays', label: 'Total Days', default: false },
  { id: 'lastAttendance', label: 'Last Attendance', default: false },
  { id: 'status', label: 'Status', default: true },
  { id: 'email', label: 'Email', default: false },
  { id: 'phoneNumber', label: 'Phone Number', default: false }
];

export function BulkActionsDialog({
  open,
  onOpenChange,
  selectedStudents,
  onActionComplete,
  onCancel
}: BulkActionsDialogProps) {
  const [activeTab, setActiveTab] = useState('status-update');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  // Status Update State
  const [statusUpdate, setStatusUpdate] = useState<BulkStatusUpdate>({
    status: 'PRESENT',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    notifyStudents: false,
    notifyParents: false
  });

  // Notification State
  const [notification, setNotification] = useState<BulkNotification>({
    type: 'email',
    subject: '',
    message: '',
    template: 'custom',
    priority: 'medium',
    scheduleFor: undefined
  });

  // Export State
  const [exportConfig, setExportConfig] = useState<BulkExportConfig>({
    format: 'csv',
    columns: EXPORT_COLUMNS.filter(col => col.default).map(col => col.id),
    includeHeaders: true,
    dateRange: undefined,
    filters: undefined
  });

  // Computed values
  const selectedCount = selectedStudents.length;
  const departments = useMemo(() => [...new Set(selectedStudents.map(s => s.department))], [selectedStudents]);
  const courses = useMemo(() => [...new Set(selectedStudents.map(s => s.course))], [selectedStudents]);
  const averageAttendance = useMemo(() => {
    const total = selectedStudents.reduce((sum, s) => sum + s.attendanceRate, 0);
    return Math.round(total / selectedCount);
  }, [selectedStudents, selectedCount]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
    if (template && templateId !== 'custom') {
      setNotification(prev => ({
        ...prev,
        template: templateId,
        subject: template.subject,
        message: template.message
      }));
    } else {
      setNotification(prev => ({
        ...prev,
        template: templateId,
        subject: '',
        message: ''
      }));
    }
  };

  // Process bulk action
  const handleProcessAction = async () => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('Preparing...');

    try {
      switch (activeTab) {
        case 'status-update':
          await processStatusUpdate();
          break;
        case 'notification':
          await processNotification();
          break;
        case 'export':
          await processExport();
          break;
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Bulk action failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const processStatusUpdate = async () => {
    setCurrentStep('Updating attendance records...');
    
    // Simulate processing with progress updates
    for (let i = 0; i <= selectedStudents.length; i++) {
      setProgress((i / selectedStudents.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // In real implementation, call API
    const results = {
      updated: selectedStudents.length,
      status: statusUpdate.status,
      date: statusUpdate.date,
      notified: statusUpdate.notifyStudents || statusUpdate.notifyParents
    };

    toast.success(`Successfully updated ${selectedStudents.length} attendance records`);
    onActionComplete('status-update', results);
    onOpenChange(false);
  };

  const processNotification = async () => {
    setCurrentStep('Sending notifications...');
    
    // Simulate processing
    for (let i = 0; i <= selectedStudents.length; i++) {
      setProgress((i / selectedStudents.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const results = {
      sent: selectedStudents.length,
      type: notification.type,
      priority: notification.priority,
      scheduled: !!notification.scheduleFor
    };

    toast.success(`Successfully sent ${selectedStudents.length} notifications`);
    onActionComplete('notification', results);
    onOpenChange(false);
  };

  const processExport = async () => {
    setCurrentStep('Generating export...');
    
    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Generate and download file
    const headers = exportConfig.columns.map(col => 
      EXPORT_COLUMNS.find(c => c.id === col)?.label || col
    );
    
    const rows = selectedStudents.map(student => 
      exportConfig.columns.map(col => {
        switch (col) {
          case 'studentId': return student.studentId;
          case 'studentName': return student.studentName;
          case 'department': return student.department;
          case 'course': return student.course;
          case 'yearLevel': return student.yearLevel;
          case 'attendanceRate': return `${student.attendanceRate}%`;
          case 'presentDays': return student.presentDays;
          case 'absentDays': return student.absentDays;
          case 'lateDays': return student.lateDays;
          case 'totalDays': return student.totalDays;
          case 'lastAttendance': return new Date(student.lastAttendance).toLocaleDateString();
          case 'status': return student.status;
          case 'email': return student.email;
          case 'phoneNumber': return student.phoneNumber;
          default: return '';
        }
      })
    );

    const csvContent = [
      exportConfig.includeHeaders ? headers.join(',') : '',
      ...rows.map(row => row.join(','))
    ].filter(Boolean).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const results = {
      exported: selectedStudents.length,
      format: exportConfig.format,
      columns: exportConfig.columns.length
    };

    toast.success(`Successfully exported ${selectedStudents.length} students`);
    onActionComplete('export', results);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Actions - {selectedCount} Students Selected
          </DialogTitle>
          <DialogDescription>
            Perform actions on {selectedCount} selected students. 
            {departments.length > 0 && ` Departments: ${departments.join(', ')}`}
          </DialogDescription>
        </DialogHeader>

        {isProcessing ? (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="font-medium">{currentStep}</p>
              <p className="text-sm text-gray-500">Processing {selectedCount} students...</p>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-center text-sm text-gray-500">
              {Math.round(progress)}% complete
            </div>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Avg Attendance</span>
                  </div>
                  <p className="text-2xl font-bold">{averageAttendance}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">At Risk</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {selectedStudents.filter(s => s.attendanceRate < 75).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="status-update" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Status Update
                </TabsTrigger>
                <TabsTrigger value="notification" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </TabsTrigger>
              </TabsList>

              <TabsContent value="status-update" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Update Attendance Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={statusUpdate.status} 
                          onValueChange={(value: any) => setStatusUpdate(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Present
                              </div>
                            </SelectItem>
                            <SelectItem value="ABSENT">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                Absent
                              </div>
                            </SelectItem>
                            <SelectItem value="LATE">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Late
                              </div>
                            </SelectItem>
                            <SelectItem value="EXCUSED">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-blue-500" />
                                Excused
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <input
                          type="date"
                          value={statusUpdate.date}
                          onChange={(e) => setStatusUpdate(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="reason">Reason (Optional)</Label>
                      <Textarea
                        placeholder="Enter reason for status update..."
                        value={statusUpdate.reason}
                        onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notify-students"
                          checked={statusUpdate.notifyStudents}
                          onCheckedChange={(checked) => setStatusUpdate(prev => ({ ...prev, notifyStudents: checked }))}
                        />
                        <Label htmlFor="notify-students">Notify students</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notify-parents"
                          checked={statusUpdate.notifyParents}
                          onCheckedChange={(checked) => setStatusUpdate(prev => ({ ...prev, notifyParents: checked }))}
                        />
                        <Label htmlFor="notify-parents">Notify parents</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notification" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Send Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="notification-type">Type</Label>
                        <Select 
                          value={notification.type} 
                          onValueChange={(value: any) => setNotification(prev => ({ ...prev, type: value }))}
                        >
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
                            <SelectItem value="sms">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                SMS
                              </div>
                            </SelectItem>
                            <SelectItem value="both">
                              <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Both
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={notification.priority} 
                          onValueChange={(value: any) => setNotification(prev => ({ ...prev, priority: value }))}
                        >
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
                    </div>

                    <div>
                      <Label htmlFor="template">Template</Label>
                      <Select 
                        value={notification.template} 
                        onValueChange={handleTemplateChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_TEMPLATES.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <input
                        type="text"
                        placeholder="Enter subject..."
                        value={notification.subject}
                        onChange={(e) => setNotification(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        placeholder="Enter message..."
                        value={notification.message}
                        onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                        rows={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Available variables: {'{student_name}'}, {'{attendance_rate}'}, {'{department}'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="format">Format</Label>
                        <Select 
                          value={exportConfig.format} 
                          onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, format: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-headers"
                          checked={exportConfig.includeHeaders}
                          onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeHeaders: !!checked }))}
                        />
                        <Label htmlFor="include-headers">Include headers</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Columns to Export</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                        {EXPORT_COLUMNS.map(column => (
                          <div key={column.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={column.id}
                              checked={exportConfig.columns.includes(column.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setExportConfig(prev => ({
                                    ...prev,
                                    columns: [...prev.columns, column.id]
                                  }));
                                } else {
                                  setExportConfig(prev => ({
                                    ...prev,
                                    columns: prev.columns.filter(c => c !== column.id)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={column.id} className="text-sm">{column.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {!isProcessing && (
              <Button variant="outline" onClick={() => setActiveTab('status-update')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
            <Button 
              onClick={handleProcessAction} 
              disabled={isProcessing || selectedCount === 0}
              className="min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Process Action
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 