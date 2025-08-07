import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  Columns3,
  Archive,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import SearchableSelectSearch, { MultiSearchableSelectSearch } from '@/components/reusable/Search/SearchableSelect';
import SelectDropdown from '@/components/SelectDropdown';

// Generic entity type
export type EntityType = 'student' | 'instructor' | 'department' | 'room' | 'course' | 'subject' | 'schedule';

// Generic bulk action configuration
export interface BulkAction {
  type: 'status-update' | 'notification' | 'export' | 'custom';
  title: string;
  description: string;
  icon: React.ReactNode;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  availableFor?: EntityType[];
}

// Generic status update configuration
export interface BulkStatusUpdate {
  status: string;
  date?: string;
  reason?: string;
  notifyRecipients?: boolean;
  // Notification fields for status update
  notificationType?: 'email' | 'in-app' | 'both';
  recipients?: string[];
  customEmails?: string[];
  subject?: string;
  message?: string;
  customFields?: Record<string, any>;
}

// Generic notification configuration
export interface BulkNotification {
  type: 'email' | 'sms' | 'both';
  subject: string;
  message: string;
  template?: string;
  priority: 'low' | 'medium' | 'high';
  scheduleFor?: string;
  recipients?: string[];
}

// Generic export configuration
export interface BulkExportConfig {
  format: 'csv' | 'excel' | 'pdf';
  columns: string[];
  dateRange?: { start: string; end: string };
  filters?: Record<string, any>;
  orientation?: 'portrait' | 'landscape';
}

// Generic export column definition
export interface ExportColumn {
  id: string;
  label: string;
  default: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean';
}

// Generic notification template
export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  availableFor?: EntityType[];
}

// Generic stats configuration
export interface EntityStats {
  total: number;
  active: number;
  inactive: number;
  custom?: Record<string, number>;
}

// Main generic props interface
export interface BulkActionsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: T[];
  entityType: EntityType;
  entityLabel: string;
  availableActions: BulkAction[];
  exportColumns: ExportColumn[];
  notificationTemplates: NotificationTemplate[];
  stats: EntityStats;
  statusOptions?: { value: string; label: string; icon?: React.ReactNode }[];
  onActionComplete: (actionType: string, results: any) => void;
  onCancel: () => void;
  onProcessAction: (actionType: string, config: any) => Promise<any>;
  getItemDisplayName: (item: T) => string;
  getItemStatus?: (item: T) => string;
  getItemEmail?: (item: T) => string;
}

// Default configurations for different entity types
export const DEFAULT_ENTITY_CONFIGS: Record<EntityType, {
  statusOptions: { value: string; label: string; icon?: React.ReactNode }[];
  defaultActions: string[];
}> = {
  student: {
    statusOptions: [
      { value: 'PRESENT', label: 'Present', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
      { value: 'ABSENT', label: 'Absent', icon: <XCircle className="w-4 h-4 text-red-500" /> },
      { value: 'LATE', label: 'Late', icon: <Clock className="w-4 h-4 text-orange-500" /> },
      { value: 'EXCUSED', label: 'Excused', icon: <AlertTriangle className="w-4 h-4 text-blue-500" /> }
    ],
    defaultActions: ['status-update', 'notification', 'export']
  },
  department: {
    statusOptions: [
      { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
      { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-4 h-4 text-red-500" /> }
    ],
    defaultActions: ['status-update', 'notification', 'export']
  },
  instructor: {
    statusOptions: [
      { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
      { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-4 h-4 text-red-500" /> },
      { value: 'on_leave', label: 'On Leave', icon: <Clock className="w-4 h-4 text-orange-500" /> }
    ],
    defaultActions: ['status-update', 'notification', 'export']
  },
  room: {
    statusOptions: [
      { value: 'available', label: 'Available', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
      { value: 'occupied', label: 'Occupied', icon: <XCircle className="w-4 h-4 text-red-500" /> },
      { value: 'maintenance', label: 'Maintenance', icon: <AlertTriangle className="w-4 h-4 text-orange-500" /> }
    ],
    defaultActions: ['status-update', 'export']
  },
  course: {
    statusOptions: [
      { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
      { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-4 h-4 text-red-500" /> },
      { value: 'completed', label: 'Completed', icon: <Clock className="w-4 h-4 text-blue-500" /> }
    ],
    defaultActions: ['status-update', 'notification', 'export']
  },
  subject: {
    statusOptions: [
      { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
      { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-4 h-4 text-red-500" /> }
    ],
    defaultActions: ['status-update', 'export']
  },
  schedule: {
    statusOptions: [
      { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
      { value: 'inactive', label: 'Inactive', icon: <XCircle className="w-4 h-4 text-red-500" /> },
      { value: 'cancelled', label: 'Cancelled', icon: <AlertTriangle className="w-4 h-4 text-orange-500" /> }
    ],
    defaultActions: ['status-update', 'notification', 'export']
  }
};

export function BulkActionsDialog<T = any>({
  open,
  onOpenChange,
  selectedItems,
  entityType,
  entityLabel,
  availableActions,
  exportColumns,
  notificationTemplates,
  stats,
  statusOptions = DEFAULT_ENTITY_CONFIGS[entityType]?.statusOptions || [],
  onActionComplete,
  onCancel,
  onProcessAction,
  getItemDisplayName,
  getItemStatus,
  getItemEmail
}: BulkActionsDialogProps<any>) {
  const [activeTab, setActiveTab] = useState('status-update');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  // Extend statusUpdate state
  const [statusUpdate, setStatusUpdate] = useState<BulkStatusUpdate>({
    status: statusOptions[0]?.value || '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    notifyRecipients: false,
    notificationType: 'in-app', // 'email' | 'in-app' | 'both'
    recipients: [], // user IDs
    customEmails: [],
    subject: '',
    message: ''
  });

  // Automatically pre-select head of department as recipient for departments
  useEffect(() => {
    if (entityType === 'department' && Array.isArray(selectedItems) && selectedItems.length > 0) {
      // Collect unique head of department IDs from selected departments
      const headIds = selectedItems
        .map((dept: any) => {
          // Try to get headOfDepartmentDetails.id or headOfDepartment (if it's an ID)
          if (dept.headOfDepartmentDetails && dept.headOfDepartmentDetails.id) {
            return dept.headOfDepartmentDetails.id;
          }
          // Fallback: if headOfDepartment is a string and matches an instructor id
          if (typeof dept.headOfDepartment === 'string') {
            return dept.headOfDepartment;
          }
          return null;
        })
        .filter(Boolean);
      // Only update if different from current recipients
      setStatusUpdate(prev => ({
        ...prev,
        recipients: headIds
      }));
    }
  }, [entityType, selectedItems]);
  // Remove exampleUsers and add instructor state
  const [instructors, setInstructors] = useState<{ id: string; name: string; email: string }[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  useEffect(() => {
    setInstructorsLoading(true);
    fetch('/api/instructors')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data)
          ? data.map((inst: any) => ({
              id: inst.id || inst.instructorId?.toString() || '',
              name: `${inst.firstName || ''} ${inst.lastName || ''}`.trim(),
              email: inst.email || ''
            }))
          : [];
        setInstructors(list);
      })
      .finally(() => setInstructorsLoading(false));
  }, []);

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
    columns: exportColumns.filter(col => col.default).map(col => col.id),
    dateRange: undefined,
    filters: undefined,
    orientation: 'portrait',
  });

  // Add state for assignment tab
  const [assignmentSchedule, setAssignmentSchedule] = useState<string>("");
  const maintenanceSchedules = [
    { id: "msched1", name: "Quarterly Maintenance" },
    { id: "msched2", name: "Annual Deep Clean" },
    { id: "msched3", name: "HVAC Check" },
  ];

  // Add state for assignment confirmation dialog
  const [assignmentConfirmOpen, setAssignmentConfirmOpen] = useState(false);

  // Add status-based templates with index signature
  interface StatusTemplate { id: string; label: string; message: string; }
  const statusTemplates: { [key: string]: StatusTemplate[] } = {
    available: [
      { id: 'available-default', label: 'Room Available', message: 'We are pleased to inform you that this room is now available for use. Please proceed with your scheduled activities as planned.' }
    ],
    occupied: [
      { id: 'occupied-default', label: 'Room Occupied', message: 'This room is currently occupied. Please check the schedule or contact the administrator for further details.' }
    ],
    maintenance: [
      { id: 'maintenance-default', label: 'Room Under Maintenance', message: 'Please be advised that this room is currently under maintenance. Access is temporarily restricted until further notice. We appreciate your understanding.' }
    ]
  };
  const currentStatusKey = (statusUpdate.status || '').toLowerCase();
  const templatesForStatus: StatusTemplate[] = statusTemplates[currentStatusKey] || [];
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Add state for new department-specific bulk actions
  const [assignInstructors, setAssignInstructors] = useState<string[]>([]); // instructor IDs
  const [assignCourses, setAssignCourses] = useState<string[]>([]); // course IDs
  const [archiveAction, setArchiveAction] = useState<'archive' | 'restore'>('archive');
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  // Fetch courses if entityType is department
  useEffect(() => {
    if (entityType === 'department') {
      fetch('/api/courses')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setCourses(data.map((c: any) => ({ id: c.id || c.code, name: c.name, code: c.code })));
          } else if (Array.isArray(data?.data)) {
            setCourses(data.data.map((c: any) => ({ id: c.id || c.code, name: c.name, code: c.code })));
          }
        });
    }
  }, [entityType]);

  // Computed values
  const selectedCount = selectedItems.length;
  const entityNames = useMemo(() => selectedItems.map(getItemDisplayName), [selectedItems, getItemDisplayName]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = notificationTemplates.find(t => t.id === templateId);
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
      let config: any;
      switch (activeTab) {
        case 'status-update':
          config = statusUpdate;
          break;
        case 'notification':
          config = notification;
          break;
        case 'export':
          // Call handleExport directly for export tab
          await handleExport();
          setIsProcessing(false);
          setProgress(0);
          setCurrentStep('');
          return; // Do not proceed to onProcessAction for export
        case 'assignment':
          if (!assignmentSchedule) {
            toast.error('Please select a maintenance schedule.');
            setIsProcessing(false);
            return;
          }
          // Open confirmation dialog instead of processing immediately
          setAssignmentConfirmOpen(true);
          setIsProcessing(false);
          return;
        default:
          throw new Error(`Unknown action type: ${activeTab}`);
      }

      const results = await onProcessAction(activeTab, config);
      onActionComplete(activeTab, results);
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Bulk action failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  // Get available tabs based on available actions
  const availableTabs = entityType === 'department'
    ? [
        'bulk-actions',
        ...availableActions.map(action => action.type === 'custom' && action.title.toLowerCase().includes('assignment') ? 'assignment' : action.type)
      ]
    : availableActions
        .map(action => action.type === 'custom' && action.title.toLowerCase().includes('assignment') ? 'assignment' : action.type);

  // Add this function inside the BulkActionsDialog component
  const [exportLoading, setExportLoading] = useState(false);
  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Prepare export data
      const selectedCols = exportColumns.filter(col => exportConfig.columns.includes(col.id));
      const headers = selectedCols.map(col => col.label);
      const rows = selectedItems.map(item => selectedCols.map(col => String((item as any)[col.id] ?? '')));
      // Add check for empty data or columns
      if (selectedItems.length === 0) {
        toast.error('No data selected for export');
        setExportLoading(false);
        return;
      }
      if (selectedCols.length === 0) {
        toast.error('No columns selected for export');
        setExportLoading(false);
        return;
      }
      switch (exportConfig.format) {
        case 'csv': {
          const csvRows = [headers, ...rows];
          const csvContent = csvRows.map(row => row.map(cell => '"' + cell.replace(/"/g, '""') + '"').join(",")).join("\n");
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${entityLabel}s.csv`;
          document.body.appendChild(a);
          console.log('Preparing download', blob, url);
          a.click();
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 1000);
          break;
        }
        case 'excel': {
          const XLSX = await import('xlsx');
          const wsData = [headers, ...rows];
          console.log('Exporting Excel: wsData', wsData);
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, `${entityLabel}s`);
          console.log('Workbook before writeFile', wb);
          XLSX.writeFile(wb, `${entityLabel}s.xlsx`);
          console.log('writeFile called');
          break;
        }
        case 'pdf': {
          const jsPDF = (await import('jspdf')).default;
          const autoTable = (await import('jspdf-autotable')).default;
          const doc = new jsPDF({
            orientation: exportConfig.orientation || 'portrait',
          });
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(12, 37, 86);
          doc.text(`${entityLabel[0].toUpperCase() + entityLabel.slice(1)}s List`, doc.internal.pageSize.width / 2, 20, { align: 'center' });
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(128, 128, 128);
          const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          doc.text(`Generated on ${currentDate}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 35,
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
            headStyles: { fillColor: [12, 37, 86], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' },
            margin: { top: 16, right: 10, bottom: 10, left: 10 },
            theme: 'grid',
          });
          doc.save(`${entityLabel}s.pdf`);
          break;
        }
        default:
          throw new Error('Unsupported export format');
      }
      toast.success(`Successfully exported ${selectedItems.length} ${entityLabel}${selectedItems.length !== 1 ? 's' : ''}`);
      // Add a small delay to ensure download is triggered before dialog closes
      await new Promise(resolve => setTimeout(resolve, 500));
      onOpenChange(false); // Close dialog after delay
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  // State for combined department actions
  const [enableAssignInstructors, setEnableAssignInstructors] = useState(false);
  const [enableArchiveRestore, setEnableArchiveRestore] = useState(false);
  const [enableAssignCourses, setEnableAssignCourses] = useState(false);

  function getProcessActionLabel() {
    if (activeTab === 'notification') return 'Send Notification';
    if (activeTab === 'status-update') return 'Update Status';
    if (activeTab === 'export') return 'Export';
    if (activeTab === 'bulk-actions') {
      const actions = [];
      if (enableAssignInstructors && assignInstructors.length > 0) actions.push('Assign Instructors');
      if (enableArchiveRestore) actions.push(archiveAction === 'archive' ? 'Archive Departments' : 'Restore Departments');
      if (enableAssignCourses && assignCourses.length > 0) actions.push('Assign Courses');
      if (actions.length === 1) return actions[0];
      if (actions.length > 1) return 'Process Bulk Actions';
      return 'Process Action';
    }
    if (activeTab === 'assignment') return 'Bulk Assignment';
    return 'Process Action';
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col h-[90vh]">
          <DialogHeader className="p-0 flex-shrink-0 mb-8">
            <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl -m-6 -mt-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    Bulk Actions Dialog
                  </DialogTitle>
                  <p className="text-blue-100 text-sm mt-1 font-medium">
                    Perform bulk operations on selected {entityLabel}{selectedCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </DialogHeader>


          {isProcessing ? (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="font-medium">{currentStep}</p>
                <p className="text-sm text-gray-500">Processing {selectedCount} {entityLabel}{selectedCount !== 1 ? 's' : ''}...</p>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-center text-sm text-gray-500">
                {Math.round(progress)}% complete
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 min-h-0 pr-2 pb-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mb-8 mt-2">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-700">Selected</p>
                        <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white rounded-" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-700">Active</p>
                        <p className="text-xl font-bold text-green-900">{stats.active}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-orange-700">Inactive</p>
                        <p className="text-xl font-bold text-orange-900">{stats.inactive}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full bg-gray-100 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 min-h-[44px]">
                  {availableTabs.map(tab => {
                    // Remove special styling for 'bulk-actions', use default tab style
                    const tabIcon =
                      tab === 'bulk-actions' ? <Users className="w-4 h-4" /> :
                      tab === 'status-update' ? <CheckCircle className="w-4 h-4" /> :
                      tab === 'notification' ? <Bell className="w-4 h-4" /> :
                      tab === 'export' ? <Download className="w-4 h-4" /> :
                      tab === 'assignment' ? <Settings className="w-4 h-4" /> :
                      null;
                    const tabLabel =
                      tab === 'bulk-actions' ? 'Bulk Actions' :
                      tab === 'status-update' ? 'Status Update' :
                      tab === 'notification' ? 'Notifications' :
                      tab === 'export' ? 'Export' :
                      tab === 'assignment' ? 'Bulk Assignment' :
                      tab;
                    return (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl text-blue-400 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200"
                      >
                        {tabIcon}
                        {tabLabel}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {availableTabs.includes('status-update') && (
                  <TabsContent value="status-update" className="space-y-4 mt-4">
                    <Card className="bg-blue-50/50 border border-blue-100 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold text-blue-900">Update {entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch">
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="status" className="text-blue-900 font-semibold mb-1">Status</Label>
                            <Select 
                              value={statusUpdate.status} 
                              onValueChange={(value: string) => {
                                setStatusUpdate(prev => ({ ...prev, status: value }));
                                setSelectedTemplateId(""); // Reset template on status change
                              }}
                            >
                              <SelectTrigger className="bg-white border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
                                {/* Only show the status text, no icon */}
                                <SelectValue>{statusOptions.find(option => option.value === statusUpdate.status)?.label || ''}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value} className="flex items-center gap-2">
                                    {option.icon}
                                    <span>{option.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="date" className="text-blue-900 font-semibold mb-1">Date</Label>
                            <input
                              type="date"
                              value={statusUpdate.date}
                              onChange={(e) => setStatusUpdate(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                            <div className="text-xs text-gray-500 mt-1">Effective date for this {entityLabel} status update.</div>
                          </div>
                        </div>
                        {/* Template Filter for Status */}
                        {templatesForStatus.length > 0 && (
                          <div>
                            <Label htmlFor="status-template" className="text-blue-900 font-semibold mb-1">Template</Label>
                            <Select
                              value={selectedTemplateId}
                              onValueChange={(templateId: string) => {
                                setSelectedTemplateId(templateId);
                                const template = templatesForStatus.find((t: StatusTemplate) => t.id === templateId);
                                if (template) {
                                  setStatusUpdate(prev => ({ ...prev, message: template.message }));
                                }
                              }}
                            >
                              <SelectTrigger className="bg-white border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
                                <SelectValue>{templatesForStatus.find((t: StatusTemplate) => t.id === selectedTemplateId)?.label || 'Select a template'}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {templatesForStatus.map((template: StatusTemplate) => (
                                  <SelectItem key={template.id} value={template.id}>{template.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="text-xs text-gray-500 mt-1">Choose a template to auto-fill the message.</div>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="reason" className="text-blue-900 font-semibold mb-1">Reason <span className="text-gray-400 font-normal">(Optional)</span></Label>
                          <Textarea
                            placeholder={`Enter reason for ${entityLabel} status update...`}
                            value={statusUpdate.reason}
                            onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                            rows={3}
                            className="bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="text-xs text-gray-500 mt-1">Provide additional context for this {entityLabel} status change.</div>
                        </div>
                        {/* Notification Type Selector */}
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch">
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="notification-type" className="text-blue-900 font-semibold mb-1">Notification Type</Label>
                            <Select
                              value={statusUpdate.notificationType}
                              onValueChange={(value: string) => setStatusUpdate(prev => ({ ...prev, notificationType: value as BulkStatusUpdate['notificationType'] }))}
                            >
                              <SelectTrigger className="bg-white border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in-app">In-App Message</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="text-xs text-gray-500 mt-1">Choose how recipients will be notified.</div>
                          </div>
                        </div>
                        {/* Recipients Picker */}
                        {statusUpdate.notifyRecipients && (
                          <div className="space-y-2">
                            <Label htmlFor="recipients" className="text-blue-900 font-semibold mb-1">Recipients</Label>
                            {entityType === 'department' ? (
                              <div className="bg-white border border-blue-100 rounded p-3">
                                {selectedItems
                                  .map((dept: any) => {
                                    if (dept.headOfDepartmentDetails && dept.headOfDepartmentDetails.email) {
                                      return {
                                        name: (dept.headOfDepartmentDetails.firstName || '') + ' ' + (dept.headOfDepartmentDetails.lastName || ''),
                                        email: dept.headOfDepartmentDetails.email
                                      };
                                    }
                                    // Fallback: try to match instructor by id
                                    const inst = instructors.find(i => i.id === dept.headOfDepartment);
                                    if (inst) {
                                      return { name: inst.name, email: inst.email };
                                    }
                                    return null;
                                  })
                                  .filter(Boolean)
                                  .reduce((acc: any[], curr: any) => {
                                    // Deduplicate by email
                                    if (!acc.some(a => a.email === curr.email)) acc.push(curr);
                                    return acc;
                                  }, [])
                                  .map((head: any, idx: number) => (
                                    <div key={head.email || idx} className="py-1 flex flex-col">
                                      <span className="font-medium text-blue-900">{head.name}</span>
                                      <span className="text-xs text-blue-700">{head.email}</span>
                                    </div>
                                  ))
                                }
                                {selectedItems.length === 0 && (
                                  <span className="text-gray-400">No department selected.</span>
                                )}
                              </div>
                            ) : (
                              <MultiSearchableSelectSearch
                                options={instructors.map(inst => ({ value: inst.id, label: `${inst.name} (${inst.email})` }))}
                                value={Array.isArray(statusUpdate.recipients) ? statusUpdate.recipients : []}
                                onChange={(selected: string[]) => setStatusUpdate(prev => ({ ...prev, recipients: selected }))}
                                placeholder="Search and select instructors..."
                                className="w-full"
                              />
                            )}
                            {/* Custom Email Input (only if Email or Both) */}
                            {(statusUpdate.notificationType === 'email' || statusUpdate.notificationType === 'both') && entityType !== 'department' && (
                              <div>
                                <Label htmlFor="custom-emails" className="text-blue-900 font-semibold mb-1">Custom Emails</Label>
                                <input
                                  type="text"
                                  id="custom-emails"
                                  placeholder="Enter emails, separated by commas"
                                  value={statusUpdate.customEmails?.join(', ') || ''}
                                  onChange={e =>
                                    setStatusUpdate(prev => ({
                                      ...prev,
                                      customEmails: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                    }))
                                  }
                                  className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="text-xs text-gray-500 mt-1">Add one or more email addresses to notify.</div>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Subject and Message Fields */}
                        {statusUpdate.notifyRecipients && (
                          <div className="space-y-2">
                            {(statusUpdate.notificationType === 'email' || statusUpdate.notificationType === 'both') && (
                              <div>
                                <Label htmlFor="subject" className="text-blue-900 font-semibold mb-1">Subject</Label>
                                <input
                                  type="text"
                                  id="subject"
                                  placeholder="Enter subject..."
                                  value={statusUpdate.subject}
                                  onChange={e => setStatusUpdate(prev => ({ ...prev, subject: e.target.value }))}
                                  className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}
                            <div>
                              <Label htmlFor="message" className="text-blue-900 font-semibold mb-1">Message</Label>
                              <Textarea
                                id="message"
                                placeholder="Enter message..."
                                value={statusUpdate.message}
                                onChange={e => setStatusUpdate(prev => ({ ...prev, message: e.target.value }))}
                                rows={4}
                                className="bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}
                        <div className="border-t border-blue-100 pt-4 mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Switch
                              id="notify-recipients"
                              checked={statusUpdate.notifyRecipients}
                              onCheckedChange={(checked) => setStatusUpdate(prev => ({ ...prev, notifyRecipients: checked }))}
                              className="scale-110"
                            />
                            <Label htmlFor="notify-recipients" className="text-blue-900 font-semibold">Notify recipients</Label>
                          </div>
                          <span className="text-xs text-gray-500">Send a notification or email to selected users</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {availableTabs.includes('notification') && (
                  <TabsContent value="notification" className="space-y-4 mt-4">
                    <Card className="bg-blue-50/50 border border-blue-100 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold text-blue-900">Send Notifications</CardTitle>
                        <p className="text-blue-700 text-sm mt-1 font-medium">Send an announcement or message to selected recipients.</p>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-2">
                        {/* Notification Type Section */}
                        <div className="space-y-1">
                          <Label htmlFor="notification-type" className="text-blue-900 font-semibold">Notification Type</Label>
                          <Select 
                            value={notification.type} 
                            onValueChange={(value: any) => setNotification(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="bg-white border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
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
                          <div className="text-xs text-gray-500 mt-1">Choose how recipients will be notified.</div>
                        </div>
                        {/* Recipients Section */}
                        <div className="space-y-1">
                          <Label htmlFor="recipients" className="text-blue-900 font-semibold">Recipients</Label>
                          <MultiSearchableSelectSearch
                            options={instructors.map(inst => ({ value: inst.id, label: `${inst.name} (${inst.email})` }))}
                            value={Array.isArray(notification.recipients) ? notification.recipients : []}
                            onChange={(selected: string[]) => setNotification(prev => ({ ...prev, recipients: selected }))}
                            placeholder="Search and select recipients..."
                            className="w-full"
                          />
                          <div className="text-xs text-gray-500 mt-1">Select one or more recipients for this notification.</div>
                          {notification.recipients && notification.recipients.length > 0 && (
                            <div className="text-xs text-blue-700 mt-1">
                              {notification.recipients.length} recipient{notification.recipients.length > 1 ? 's' : ''} selected
                            </div>
                          )}
                        </div>
                        {/* Subject Section */}
                        <div className="space-y-1">
                          <Label htmlFor="subject" className="text-blue-900 font-semibold">Subject</Label>
                          <input
                            type="text"
                            placeholder="Enter subject..."
                            value={notification.subject}
                            onChange={(e) => setNotification(prev => ({ ...prev, subject: e.target.value }))}
                            className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        {/* Message Section */}
                        <div className="space-y-1">
                          <Label htmlFor="message" className="text-blue-900 font-semibold">Message</Label>
                          <Textarea
                            placeholder="Enter your message..."
                            value={notification.message}
                            onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                            rows={6}
                            className="bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="text-xs text-gray-500 mt-1">Write the content of your notification. Markdown is supported.</div>
                        </div>
                        {/* Preview Section */}
                        {notification.message && (
                          <div className="bg-blue-50 border border-blue-100 rounded p-3 mt-2">
                            <div className="text-xs text-blue-900 font-semibold mb-1">Preview</div>
                            <div className="prose prose-sm max-w-none text-blue-900" style={{ whiteSpace: 'pre-wrap' }}>{notification.message}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {availableTabs.includes('export') && (
                  <TabsContent value="export" className="space-y-4">
                    <Card className="bg-blue-50/50 border border-blue-100 shadow-none">
                      <CardHeader className="pb-2 flex flex-row items-center gap-2">
                        <CardTitle className="text-lg font-bold text-blue-900">Export Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label htmlFor="format" className="text-blue-900 font-semibold mt-4 mb-4 flex items-center gap-2">
                            Export Format
                          </Label>
                          <Select 
                            value={exportConfig.format} 
                            onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, format: value }))}
                          >
                            <SelectTrigger className="text-blue-900 bg-white border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="csv">CSV (Comma-separated values)</SelectItem>
                              <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                              <SelectItem value="pdf">PDF Document</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-gray-500 mt-2">Choose the file format for your export.</div>
                        </div>
                        {exportConfig.format === 'pdf' && (
                          <div>
                            <Label htmlFor="orientation" className="text-blue-900 font-semibold mt-4 mb-4 flex items-center gap-2">
                              PDF Orientation
                            </Label>
                            <Select
                              value={exportConfig.orientation || 'portrait'}
                              onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, orientation: value }))}
                            >
                              <SelectTrigger className="text-blue-900 bg-white border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="portrait">Portrait</SelectItem>
                                <SelectItem value="landscape">Landscape</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="text-xs text-gray-500 mt-2">Choose the page orientation for your PDF export.</div>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-blue-900 font-semibold flex items-center gap-2">
                            Columns to Export
                          </Label>
                          <span className="text-xs text-blue-700 font-semibold">{exportConfig.columns.length} selected</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto bg-white/60 rounded p-2 border border-blue-100">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-columns"
                              checked={exportConfig.columns.length === exportColumns.length}
                              indeterminate={exportConfig.columns.length > 0 && exportConfig.columns.length < exportColumns.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setExportConfig(prev => ({ ...prev, columns: exportColumns.map(col => col.id) }));
                                } else {
                                  setExportConfig(prev => ({ ...prev, columns: [] }));
                                }
                              }}
                            />
                            <Label htmlFor="select-all-columns" className="text-blue-700 font-medium cursor-pointer">Select All</Label>
                          </div>
                          {exportColumns.filter(col => !['totalSchedules', 'totalAssignments'].includes(col.id)).map(column => (
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
                              <Label htmlFor={column.id} className="text-sm text-blue-900 font-medium cursor-pointer">{column.label}</Label>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Select which columns to include in your export file.</div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {availableTabs.includes('assignment') && (
                  <TabsContent value="assignment" className="space-y-4 mt-4">
                    <Card className="bg-blue-50/50 border border-blue-100 shadow-none">
                      <CardHeader className="pb-2 flex flex-row items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-700 mr-2" />
                        <CardTitle className="text-lg font-bold text-blue-900">Bulk Assignment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <Label htmlFor="assignment-schedule" className="text-blue-900 font-semibold mb-1 flex items-center gap-2 mb-4">
                            Assign to Maintenance Schedule
                          </Label>
                          <SelectDropdown
                            value={assignmentSchedule}
                            onValueChange={setAssignmentSchedule}
                            options={maintenanceSchedules.map(sched => ({ value: sched.id, label: sched.name }))}
                            placeholder="Select a schedule"
                            className="mb-2 bg-white text-blue-900 border-blue-200 rounded text-sm"
                          />
                          <div className="text-xs text-gray-500 mt-1">Choose a maintenance schedule to assign to the selected {entityLabel}s.</div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-blue-500 text-white font-bold rounded-full px-3 py-1 text-sm shadow-none">
                            {selectedItems.length} {entityLabel}{selectedItems.length !== 1 ? 's' : ''} selected
                          </Badge>
                          <span className="text-xs text-blue-900">will be assigned to this schedule.</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
                {/* Combined Bulk Actions Tab */}
                {entityType === 'department' && (
                  <TabsContent value="bulk-actions" className="space-y-4 mt-4">
                    <Card className="bg-blue-50/50 border border-blue-100 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-bold text-blue-900">Bulk Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Enable/disable checkboxes */}
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2">
                            <Checkbox checked={enableAssignInstructors} onCheckedChange={setEnableAssignInstructors} />
                            <span className="font-medium text-blue-900">Assign Instructors</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={enableArchiveRestore} onCheckedChange={setEnableArchiveRestore} />
                            <span className="font-medium text-blue-900">Archive/Restore Departments</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox checked={enableAssignCourses} onCheckedChange={setEnableAssignCourses} />
                            <span className="font-medium text-blue-900">Assign Courses</span>
                          </label>
                        </div>
                        {/* Assign Instructors UI */}
                        {enableAssignInstructors && (
                          <div className="space-y-2">
                            <Label className="text-blue-900 font-semibold mb-1">Select Instructors to Assign</Label>
                            <MultiSearchableSelectSearch
                              options={instructors.map(inst => ({ value: inst.id, label: `${inst.name} (${inst.email})` }))}
                              value={assignInstructors}
                              onChange={setAssignInstructors}
                              placeholder="Search and select instructors..."
                              className="w-full"
                            />
                          </div>
                        )}
                        {/* Archive/Restore UI */}
                        {enableArchiveRestore && (
                          <div className="space-y-2">
                            <Label className="text-blue-900 font-semibold mb-1">Action</Label>
                            <Select value={archiveAction} onValueChange={v => setArchiveAction(v as 'archive' | 'restore')}>
                              <SelectTrigger className="bg-white border border-blue-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="archive">Archive</SelectItem>
                                <SelectItem value="restore">Restore</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {/* Assign Courses UI */}
                        {enableAssignCourses && (
                          <div className="space-y-2">
                            <Label className="text-blue-900 font-semibold mb-1">Select Courses to Assign</Label>
                            <MultiSearchableSelectSearch
                              options={courses.map(course => ({ value: course.id, label: `${course.name} (${course.code})` }))}
                              value={assignCourses}
                              onChange={setAssignCourses}
                              placeholder="Search and select courses..."
                              className="w-full"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" className="rounded-xl hover:border-red-400 hover:text-red-400 hover:bg-red-50" onClick={onCancel} disabled={isProcessing}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {!isProcessing && (
                <Button variant="outline" className="rounded-xl" onClick={() => setActiveTab('status-update')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              )}
              <Button 
                onClick={handleProcessAction} 
                disabled={isProcessing || selectedCount === 0}
                className="min-w-[120px] rounded-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {getProcessActionLabel()}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {entityType !== 'department' && (
        <Dialog open={assignmentConfirmOpen} onOpenChange={setAssignmentConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Assignment</DialogTitle>
              <DialogDescription>
                Are you sure you want to assign <b>{selectedItems.length}</b> {entityLabel}{selectedItems.length !== 1 ? 's' : ''} to <b>{maintenanceSchedules.find(s => s.id === assignmentSchedule)?.name || 'the selected schedule'}</b>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignmentConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={async () => {
                  setAssignmentConfirmOpen(false);
                  setIsProcessing(true);
                  setProgress(0);
                  setCurrentStep('Assigning...');
                  try {
                    const config = { scheduleId: assignmentSchedule };
                    const results = await onProcessAction('assignment', config);
                    onActionComplete('assignment', results);
                    setAssignmentSchedule("");
                  } catch (error) {
                    toast.error('Bulk assignment failed. Please try again.');
                  } finally {
                    setIsProcessing(false);
                    setProgress(0);
                    setCurrentStep('');
                  }
                }}
              >
                Confirm Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 