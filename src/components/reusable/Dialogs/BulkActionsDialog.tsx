"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Settings, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Info,
  Loader2,
  FileText,
  HardDrive,
  Clock,
  User,
  Bell,
  Calendar,
  Archive,
  RotateCcw,
  Users,
  Building,
  BookOpen,
  MapPin,
  Tag,
  Wifi,
  MessageSquare,
  FileSpreadsheet,
  FileDown,
  Columns,
  Filter,
  Database,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  Search,
  Plus,
  Minus
} from "lucide-react";

// Export format configurations
const EXPORT_FORMATS = {
  csv: {
    label: 'CSV (Comma Separated Values)',
    icon: <FileText className="w-4 h-4" />,
    description: 'Best for data analysis and spreadsheet applications',
    extension: '.csv',
    mimeType: 'text/csv'
  },
  excel: {
    label: 'Excel (.xlsx)',
    icon: <FileSpreadsheet className="w-4 h-4" />,
    description: 'Best for complex formatting and charts',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  pdf: {
    label: 'PDF Document',
    icon: <FileDown className="w-4 h-4" />,
    description: 'Best for printing and sharing',
    extension: '.pdf',
    mimeType: 'application/pdf'
  },
  json: {
    label: 'JSON (JavaScript Object Notation)',
    icon: <FileText className="w-4 h-4" />,
    description: 'Best for API integration and data processing',
    extension: '.json',
    mimeType: 'application/json'
  }
};

// Status options for different entities
const STATUS_OPTIONS = {
  department: [
    { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'inactive', label: 'Inactive', icon: <X className="w-4 h-4" /> },
    { value: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" /> }
  ],
  course: [
    { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'inactive', label: 'Inactive', icon: <X className="w-4 h-4" /> },
    { value: 'draft', label: 'Draft', icon: <FileText className="w-4 h-4" /> },
    { value: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" /> }
  ],
  backup: [
    { value: 'completed', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'failed', label: 'Failed', icon: <X className="w-4 h-4" /> },
    { value: 'in_progress', label: 'In Progress', icon: <Activity className="w-4 h-4" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <X className="w-4 h-4" /> }
  ]
};

// Notification templates for different contexts
const NOTIFICATION_TEMPLATES = {
  general: [
    {
      id: 'welcome',
      name: 'Welcome Message',
      subject: 'Welcome to the System',
      message: 'Welcome! We\'re excited to have you on board. Please take a moment to familiarize yourself with the platform features.',
      priority: 'low' as const
    },
    {
      id: 'update',
      name: 'System Update',
      subject: 'Important System Update',
      message: 'We\'ve made some important updates to improve your experience. Please review the changes and let us know if you have any questions.',
      priority: 'medium' as const
    },
    {
      id: 'maintenance',
      name: 'Maintenance Notice',
      subject: 'Scheduled Maintenance',
      message: 'We will be performing scheduled maintenance on [date] from [time]. During this time, some features may be temporarily unavailable.',
      priority: 'high' as const
    }
  ],
  course: [
    {
      id: 'course_start',
      name: 'Course Starting Soon',
      subject: 'Your Course Begins Tomorrow',
      message: 'Your course is scheduled to begin tomorrow. Please ensure you have all required materials and are ready to participate.',
      priority: 'medium' as const
    },
    {
      id: 'assignment_due',
      name: 'Assignment Due',
      subject: 'Assignment Due Date Reminder',
      message: 'This is a friendly reminder that your assignment is due soon. Please submit your work on time to avoid any penalties.',
      priority: 'high' as const
    },
    {
      id: 'grade_available',
      name: 'Grades Available',
      subject: 'Your Grades Are Ready',
      message: 'Your grades for the recent assessment are now available. Please log in to view your results and feedback.',
      priority: 'low' as const
    }
  ],
  department: [
    {
      id: 'meeting_reminder',
      name: 'Meeting Reminder',
      subject: 'Department Meeting Tomorrow',
      message: 'Reminder: We have a department meeting scheduled for tomorrow. Please prepare any updates or questions you may have.',
      priority: 'medium' as const
    },
    {
      id: 'policy_update',
      name: 'Policy Update',
      subject: 'Updated Department Policies',
      message: 'We have updated our department policies. Please review the changes and ensure compliance with the new guidelines.',
      priority: 'high' as const
    }
  ]
};

// Entity-specific configurations
const ENTITY_CONFIGS = {
  'department': {
    icon: <Building className="w-5 h-5" />,
    color: 'blue',
    availableColumns: [
      { key: 'id', label: 'ID', default: false },
      { key: 'name', label: 'Name', default: true },
      { key: 'code', label: 'Code', default: true },
      { key: 'description', label: 'Description', default: true },
      { key: 'headOfDepartment', label: 'Head of Department', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'createdAt', label: 'Created Date', default: false },
      { key: 'updatedAt', label: 'Last Updated', default: false }
    ],
    availableActions: [
      {
        id: 'status-update',
        label: 'Update Status',
        description: 'Change the status of selected departments',
        icon: <Settings className="w-4 h-4" />,
        tabId: 'status',
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to update the status of the selected departments?'
      },
      {
        id: 'export',
        label: 'Export Data',
        description: 'Export department information with custom options',
        icon: <Download className="w-4 h-4" />,
        tabId: 'export',
        requiresConfirmation: false
      },
      {
        id: 'notification',
        label: 'Send Notifications',
        description: 'Send notifications to department heads',
        icon: <Bell className="w-4 h-4" />,
        tabId: 'notification',
        requiresConfirmation: false
      }
    ],
    tableColumns: [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'status', label: 'Status' },
      { key: 'headOfDepartment', label: 'Head' }
    ]
  },
  'course': {
    icon: <BookOpen className="w-5 h-5" />,
    color: 'green',
    availableColumns: [
      { key: 'id', label: 'ID', default: false },
      { key: 'name', label: 'Name', default: true },
      { key: 'code', label: 'Code', default: true },
      { key: 'description', label: 'Description', default: true },
      { key: 'department', label: 'Department', default: true },
      { key: 'credits', label: 'Credits', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'createdAt', label: 'Created Date', default: false },
      { key: 'updatedAt', label: 'Last Updated', default: false }
    ],
    availableActions: [
      {
        id: 'status-update',
        label: 'Update Status',
        description: 'Change the status of selected courses',
        icon: <Settings className="w-4 h-4" />,
        tabId: 'status',
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to update the status of the selected courses?'
      },
      {
        id: 'export',
        label: 'Export Data',
        description: 'Export course information with custom options',
        icon: <Download className="w-4 h-4" />,
        tabId: 'export',
        requiresConfirmation: false
      },
      {
        id: 'notification',
        label: 'Send Notifications',
        description: 'Send notifications to course instructors',
        icon: <Bell className="w-4 h-4" />,
        tabId: 'notification',
        requiresConfirmation: false
      }
    ],
    tableColumns: [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status' }
    ]
  },
  'subject': {
    icon: <BookOpen className="w-5 h-5" />,
    color: 'blue',
    availableColumns: [
      { key: 'subjectId', label: 'ID', default: false },
      { key: 'subjectName', label: 'Subject Name', default: true },
      { key: 'subjectCode', label: 'Code', default: true },
      { key: 'subjectType', label: 'Type', default: true },
      { key: 'creditedUnits', label: 'Units', default: true },
      { key: 'semester', label: 'Semester', default: true },
      { key: 'academicYear', label: 'Academic Year', default: true },
      { key: 'department', label: 'Department', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'maxStudents', label: 'Max Students', default: false },
      { key: 'totalHours', label: 'Total Hours', default: false },
      { key: 'createdAt', label: 'Created Date', default: false },
      { key: 'updatedAt', label: 'Last Updated', default: false }
    ],
    availableActions: [
      {
        id: 'status-update',
        label: 'Update Status',
        description: 'Change the status of selected subjects',
        icon: <Settings className="w-4 h-4" />,
        tabId: 'status',
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to update the status of the selected subjects?'
      },
      {
        id: 'export',
        label: 'Export Data',
        description: 'Export subject information with custom options',
        icon: <Download className="w-4 h-4" />,
        tabId: 'export',
        requiresConfirmation: false
      }
    ],
    tableColumns: [
      { key: 'subjectName', label: 'Subject Name' },
      { key: 'subjectCode', label: 'Code' },
      { key: 'subjectType', label: 'Type' },
      { key: 'department', label: 'Department' },
      { key: 'status', label: 'Status' }
    ]
  },
  'backup': {
    icon: <HardDrive className="w-5 h-5" />,
    color: 'gray',
    availableColumns: [
      { key: 'id', label: 'ID', default: false },
      { key: 'name', label: 'Name', default: true },
      { key: 'type', label: 'Type', default: true },
      { key: 'status', label: 'Status', default: true },
      { key: 'size', label: 'Size', default: true },
      { key: 'createdAt', label: 'Created Date', default: true },
      { key: 'completedAt', label: 'Completed Date', default: false },
      { key: 'description', label: 'Description', default: false }
    ],
    availableActions: [
      {
        id: 'download',
        label: 'Download Selected',
        description: 'Download all selected completed backups',
        icon: <Download className="w-4 h-4" />,
        tabId: 'download',
        requiresConfirmation: true
      },
      {
        id: 'delete',
        label: 'Delete Selected',
        description: 'Permanently delete selected backups',
        icon: <Trash2 className="w-4 h-4" />,
        tabId: 'delete',
        requiresConfirmation: true
      },
      {
        id: 'refresh',
        label: 'Refresh Status',
        description: 'Update status of selected backups',
        icon: <RefreshCw className="w-4 h-4" />,
        tabId: 'refresh',
        requiresConfirmation: true
      },
      {
        id: 'export',
        label: 'Export Details',
        description: 'Export backup details with custom options',
        icon: <FileText className="w-4 h-4" />,
        tabId: 'export',
        requiresConfirmation: false
      }
    ],
    tableColumns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'size', label: 'Size' },
      { key: 'createdAt', label: 'Created' }
    ]
  }
};

interface BulkActionsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: T[];
  entityType: string;
  entityLabel: string;
  availableActions?: {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    tabId: string;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
    disabled?: boolean;
  }[];
  onActionComplete: (actionType: string, results: any) => void;
  onCancel: () => void;
  onProcessAction: (actionType: string, config: any) => Promise<{ success: boolean; processed?: number }>;
  getItemDisplayName: (item: T) => string;
  getItemStatus: (item: T) => string;
  getItemId: (item: T) => string;
  canPerformActions?: boolean;
  customActions?: {
    [actionId: string]: (items: T[], config?: any) => Promise<void>;
  };
}

interface ActionProgress {
  [itemId: string]: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    message: string;
    error?: string;
  };
}

interface ExportConfig {
  format: string;
  selectedColumns: string[];
  includeHeaders: boolean;
  fileName?: string;
}

interface StatusConfig {
  newStatus: string;
  reason?: string;
}

interface NotificationConfig {
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  includeAttachments: boolean;
  template?: string;
}

function BulkActionsDialog<T = any>({ 
  open, 
  onOpenChange, 
  selectedItems,
  entityType,
  entityLabel,
  availableActions,
  onActionComplete,
  onCancel,
  onProcessAction,
  getItemDisplayName,
  getItemStatus,
  getItemId,
  canPerformActions = true,
  customActions = {}
}: BulkActionsDialogProps<T>) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionProgress, setActionProgress] = useState<ActionProgress>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('export');
  
  // Configuration states
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'csv',
    selectedColumns: [],
    includeHeaders: true,
    fileName: ''
  });
  
  const [statusConfig, setStatusConfig] = useState<StatusConfig>({
    newStatus: 'active',
    reason: ''
  });
  
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    subject: '',
    message: '',
    priority: 'medium',
    includeAttachments: false,
    template: ''
  });

  // Notification confirmation states
  const [showNotificationConfirmation, setShowNotificationConfirmation] = useState(false);
  const [notificationResults, setNotificationResults] = useState<{
    success: boolean;
    processed: number;
    failed: number;
    errors?: string[];
  } | null>(null);

  // Preview section states
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isPreviewEditing, setIsPreviewEditing] = useState(false);
  const [editableSelectedItems, setEditableSelectedItems] = useState<T[]>(selectedItems);
  const [searchTerm, setSearchTerm] = useState('');

  // Get entity configuration
  const entityConfig = ENTITY_CONFIGS[entityType as keyof typeof ENTITY_CONFIGS] || ENTITY_CONFIGS['course'];
  
  // Use provided props or fall back to entity config defaults
  const finalAvailableActions = availableActions || entityConfig.availableActions;

  // Initialize export config with default columns
  useEffect(() => {
    if (entityConfig.availableColumns) {
      const defaultColumns = entityConfig.availableColumns
        .filter(col => col.default)
        .map(col => col.key);
      
      setExportConfig(prev => ({
        ...prev,
        selectedColumns: defaultColumns,
        fileName: `${entityLabel}_export_${new Date().toISOString().split('T')[0]}`
      }));
    }
  }, [entityType, entityLabel]);

  // Initialize progress for selected items
  useEffect(() => {
    if (editableSelectedItems.length > 0) {
      const initialProgress: ActionProgress = {};
      editableSelectedItems.forEach(item => {
        const itemId = getItemId(item);
        initialProgress[itemId] = {
          status: 'pending',
          progress: 0,
          message: 'Waiting to start...'
        };
      });
      setActionProgress(initialProgress);
    }
  }, [editableSelectedItems, getItemId]);

  // Sync editable items when selectedItems change
  useEffect(() => {
    setEditableSelectedItems(selectedItems);
  }, [selectedItems]);

  // Handle bulk action execution
  const handleBulkAction = async (actionId: string, config?: any) => {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    // Use editable items instead of original selected items
    const itemsToProcess = editableSelectedItems;

    // Check if it's a custom action
    if (customActions[actionId]) {
      try {
        await customActions[actionId](itemsToProcess, config);
        successCount = itemsToProcess.length;
        toast.success(`Successfully processed ${successCount} ${entityLabel}`);
      } catch (error) {
        failCount = itemsToProcess.length;
        toast.error(`Failed to process ${entityLabel}`);
      }
      setIsProcessing(false);
      onActionComplete(actionId, { success: successCount > 0, processed: successCount });
      return;
    }

    // Handle specific action types
    switch (actionId) {
      case 'export':
        await handleExportAction(itemsToProcess, config);
        break;
      case 'status-update':
        await handleStatusUpdateAction(itemsToProcess, config);
        break;
      case 'notification':
        await handleNotificationAction(itemsToProcess, config);
        break;
      case 'delete':
        await handleDeleteAction(itemsToProcess, config);
        break;
      case 'download':
        await handleDownloadAction(itemsToProcess, config);
        break;
      case 'refresh':
        await handleRefreshAction(itemsToProcess, config);
        break;
      default:
        // Handle standard actions via onProcessAction
        for (const item of itemsToProcess) {
          const itemId = getItemId(item);
          
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: 0,
              message: 'Processing...'
            }
          }));

          try {
            // Simulate progress updates
            for (let i = 0; i <= 100; i += 20) {
              setActionProgress(prev => ({
                ...prev,
                [itemId]: {
                  status: 'in_progress',
                  progress: i,
                  message: `Processing ${getItemDisplayName(item)}...`
                }
              }));
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            const result = await onProcessAction(actionId, config || {});
            
            if (result.success) {
              setActionProgress(prev => ({
                ...prev,
                [itemId]: {
                  status: 'completed',
                  progress: 100,
                  message: 'Completed successfully'
                }
              }));
              successCount++;
            } else {
              setActionProgress(prev => ({
                ...prev,
                [itemId]: {
                  status: 'failed',
                  progress: 0,
                  message: 'Action failed',
                  error: 'Failed to process item'
                }
              }));
              failCount++;
            }
          } catch (error) {
            setActionProgress(prev => ({
              ...prev,
              [itemId]: {
                status: 'failed',
                progress: 0,
                message: 'Action failed',
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
            failCount++;
          }
        }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully processed ${successCount} ${entityLabel}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to process ${failCount} ${entityLabel}`);
    }

    onActionComplete(actionId, { success: successCount > 0, processed: successCount });
  };

  // Handle Export Action
  const handleExportAction = async (items: T[], config: any) => {
    const { exportConfig, format } = config;
    
    for (const item of items) {
      const itemId = getItemId(item);
      
      setActionProgress(prev => ({
        ...prev,
        [itemId]: {
          status: 'in_progress',
          progress: 0,
          message: 'Preparing export...'
        }
      }));

      try {
        // Simulate export preparation
        for (let i = 0; i <= 50; i += 10) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: i,
              message: `Preparing ${getItemDisplayName(item)} for export...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Prepare data for export
        const exportData = items.map(item => {
          const row: any = {};
          exportConfig.selectedColumns.forEach((columnKey: string) => {
            if (columnKey === 'id') row[columnKey] = getItemId(item);
            else if (columnKey === 'name') row[columnKey] = getItemDisplayName(item);
            else if (columnKey === 'status') row[columnKey] = getItemStatus(item);
            else {
              const value = (item as any)[columnKey];
              // Handle nested objects like department
              if (columnKey === 'department' && value && typeof value === 'object') {
                row[columnKey] = value.departmentName || value.name || 'Unknown Department';
              }
              // Handle other nested objects
              else if (value && typeof value === 'object') {
                row[columnKey] = JSON.stringify(value);
              }
              else {
                row[columnKey] = value || '';
              }
            }
          });
          return row;
        });

        // Generate file content based on format
        let fileContent = '';
        let fileName = exportConfig.fileName || `${entityLabel}_export_${new Date().toISOString().split('T')[0]}`;
        
        switch (exportConfig.format) {
          case 'csv':
            fileContent = generateCSV(exportData, exportConfig.includeHeaders);
            fileName += '.csv';
            break;
          case 'excel':
            fileContent = generateExcel(exportData, exportConfig.includeHeaders);
            fileName += '.xlsx';
            break;
          case 'pdf':
            fileContent = generatePDF(exportData, exportConfig.includeHeaders);
            fileName += '.pdf';
            break;
          case 'json':
            fileContent = generateJSON(exportData);
            fileName += '.json';
            break;
        }

        // Simulate file generation
        for (let i = 50; i <= 100; i += 10) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: i,
              message: `Generating ${format.label} file...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Download the file
        downloadFile(fileContent, fileName, format.mimeType);

        setActionProgress(prev => ({
          ...prev,
          [itemId]: {
            status: 'completed',
            progress: 100,
            message: `Exported as ${format.label}`
          }
        }));

      } catch (error) {
        setActionProgress(prev => ({
          ...prev,
          [itemId]: {
            status: 'failed',
            progress: 0,
            message: 'Export failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    }
  };

  // Handle Status Update Action
  const handleStatusUpdateAction = async (items: T[], config: any) => {
    const { statusConfig } = config;
    
    for (const item of items) {
      const itemId = getItemId(item);
      
      setActionProgress(prev => ({
        ...prev,
        [itemId]: {
          status: 'in_progress',
          progress: 0,
          message: 'Updating status...'
        }
      }));

      try {
        // Simulate status update
        for (let i = 0; i <= 100; i += 25) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: i,
              message: `Updating status to ${statusConfig.newStatus}...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Call the actual status update function
        const result = await onProcessAction('status-update', {
          itemId: getItemId(item),
          newStatus: statusConfig.newStatus,
          reason: statusConfig.reason
        });

        if (result.success) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'completed',
              progress: 100,
              message: `Status updated to ${statusConfig.newStatus}`
            }
          }));
        } else {
          throw new Error('Status update failed');
        }

      } catch (error) {
        setActionProgress(prev => ({
          ...prev,
          [itemId]: {
            status: 'failed',
            progress: 0,
            message: 'Status update failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    }
  };

  // Handle Notification Action
  const handleNotificationAction = async (items: T[], config: any) => {
    const { notificationConfig } = config;
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    
    for (const item of items) {
      const itemId = getItemId(item);
      
      setActionProgress(prev => ({
        ...prev,
        [itemId]: {
          status: 'in_progress',
          progress: 0,
          message: 'Sending notification...'
        }
      }));

      try {
        // Simulate notification sending
        for (let i = 0; i <= 100; i += 20) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: i,
              message: `Sending notification to ${getItemDisplayName(item)}...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Call the actual notification function
        const result = await onProcessAction('notification', {
          itemId: getItemId(item),
          subject: notificationConfig.subject,
          message: notificationConfig.message,
          priority: notificationConfig.priority,
          includeAttachments: notificationConfig.includeAttachments
        });

        if (result.success) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'completed',
              progress: 100,
              message: 'Notification sent successfully'
            }
          }));
          successCount++;
        } else {
          throw new Error('Notification failed');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setActionProgress(prev => ({
          ...prev,
          [itemId]: {
            status: 'failed',
            progress: 0,
            message: 'Notification failed',
            error: errorMessage
          }
        }));
        failCount++;
        errors.push(`${getItemDisplayName(item)}: ${errorMessage}`);
      }
    }

    // Set notification results for feedback
    setNotificationResults({
      success: successCount > 0,
      processed: successCount,
      failed: failCount,
      errors: errors.length > 0 ? errors : undefined
    });

    // Show appropriate toast messages
    if (successCount > 0) {
      toast.success(`Successfully sent notifications to ${successCount} ${entityLabel}${failCount > 0 ? ` (${failCount} failed)` : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to send notifications to ${failCount} ${entityLabel}`);
    }
  };

  // Handle Delete Action
  const handleDeleteAction = async (items: T[], config?: any) => {
    for (const item of items) {
      const itemId = getItemId(item);
      
      setActionProgress(prev => ({
        ...prev,
        [itemId]: {
          status: 'in_progress',
          progress: 0,
          message: 'Deleting...'
        }
      }));

      try {
        // Simulate deletion
        for (let i = 0; i <= 100; i += 25) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: i,
              message: `Deleting ${getItemDisplayName(item)}...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const result = await onProcessAction('delete', { itemId: getItemId(item) });

        if (result.success) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'completed',
              progress: 100,
              message: 'Deleted successfully'
            }
          }));
        } else {
          throw new Error('Deletion failed');
        }

      } catch (error) {
        setActionProgress(prev => ({
          ...prev,
          [itemId]: {
            status: 'failed',
            progress: 0,
            message: 'Deletion failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    }
  };

  // Handle Download Action
  const handleDownloadAction = async (items: T[], config?: any) => {
    for (const item of items) {
      const itemId = getItemId(item);
      
      setActionProgress(prev => ({
        ...prev,
        [itemId]: {
          status: 'in_progress',
          progress: 0,
          message: 'Preparing download...'
        }
      }));

      try {
        // Simulate download preparation
        for (let i = 0; i <= 100; i += 20) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: i,
              message: `Preparing ${getItemDisplayName(item)} for download...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const result = await onProcessAction('download', { itemId: getItemId(item) });

        if (result.success) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'completed',
              progress: 100,
              message: 'Download completed'
            }
          }));
        } else {
          throw new Error('Download failed');
        }

      } catch (error) {
        setActionProgress(prev => ({
          ...prev,
          [itemId]: {
            status: 'failed',
            progress: 0,
            message: 'Download failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    }
  };

  // Handle Refresh Action
  const handleRefreshAction = async (items: T[], config?: any) => {
    for (const item of items) {
      const itemId = getItemId(item);
      
      setActionProgress(prev => ({
        ...prev,
        [itemId]: {
          status: 'in_progress',
          progress: 0,
          message: 'Refreshing...'
        }
      }));

      try {
        // Simulate refresh
        for (let i = 0; i <= 100; i += 25) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'in_progress',
              progress: i,
              message: `Refreshing ${getItemDisplayName(item)}...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const result = await onProcessAction('refresh', { itemId: getItemId(item) });

        if (result.success) {
          setActionProgress(prev => ({
            ...prev,
            [itemId]: {
              status: 'completed',
              progress: 100,
              message: 'Refreshed successfully'
            }
          }));
        } else {
          throw new Error('Refresh failed');
        }

      } catch (error) {
        setActionProgress(prev => ({
          ...prev,
          [itemId]: {
            status: 'failed',
            progress: 0,
            message: 'Refresh failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    }
  };

  // Handle action execution from tabs
  const handleTabAction = async (actionId: string) => {
    const action = finalAvailableActions.find(a => a.id === actionId);
    if (!action) return;

    setSelectedAction(actionId);
    
    let config = {};
    
    // Build config based on action type
    switch (actionId) {
      case 'export':
        config = {
          exportConfig,
          format: EXPORT_FORMATS[exportConfig.format as keyof typeof EXPORT_FORMATS]
        };
        break;
      case 'status-update':
        config = { statusConfig };
        break;
      case 'notification':
        config = { notificationConfig };
        // Show notification confirmation dialog
        setShowNotificationConfirmation(true);
        return;
      default:
        config = {};
    }
    
    if (action.requiresConfirmation) {
      setConfirmationMessage((action as any).confirmationMessage || `Are you sure you want to perform this action on ${editableSelectedItems.length} ${entityLabel}?`);
      setShowConfirmation(true);
    } else {
      await handleBulkAction(actionId, config);
    }
  };

  // Handle confirmation
  const handleConfirmAction = async () => {
    if (selectedAction) {
      setShowConfirmation(false);
      setSelectedAction(null);
      
      let config = {};
      switch (selectedAction) {
        case 'export':
          config = {
            exportConfig,
            format: EXPORT_FORMATS[exportConfig.format as keyof typeof EXPORT_FORMATS]
          };
          break;
        case 'status-update':
          config = { statusConfig };
          break;
        case 'notification':
          config = { notificationConfig };
          break;
        default:
          config = {};
      }
      
      await handleBulkAction(selectedAction, config);
    }
  };

  // Handle notification confirmation
  const handleNotificationConfirm = async () => {
    setShowNotificationConfirmation(false);
    setNotificationResults(null);
    
    const config = { notificationConfig };
    await handleBulkAction('notification', config);
  };

  // Handle column selection
  const handleColumnToggle = (columnKey: string) => {
    setExportConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(columnKey)
        ? prev.selectedColumns.filter(col => col !== columnKey)
        : [...prev.selectedColumns, columnKey]
    }));
  };

  // Handle select all columns
  const handleSelectAllColumns = () => {
    if (entityConfig.availableColumns) {
      setExportConfig(prev => ({
        ...prev,
        selectedColumns: entityConfig.availableColumns.map(col => col.key)
      }));
    }
  };

  // Handle deselect all columns
  const handleDeselectAllColumns = () => {
    setExportConfig(prev => ({
      ...prev,
      selectedColumns: []
    }));
  };

  // Handle item selection/deselection
  const handleItemToggle = (item: T) => {
    const itemId = getItemId(item);
    setEditableSelectedItems(prev => {
      const isSelected = prev.some(selectedItem => getItemId(selectedItem) === itemId);
      if (isSelected) {
        return prev.filter(selectedItem => getItemId(selectedItem) !== itemId);
      } else {
        return [...prev, item];
      }
    });
  };

  // Handle select all items
  const handleSelectAllItems = () => {
    setEditableSelectedItems(selectedItems);
  };

  // Handle deselect all items
  const handleDeselectAllItems = () => {
    setEditableSelectedItems([]);
  };

  // Filter items based on search term
  const filteredItems = selectedItems.filter(item => 
    getItemDisplayName(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getItemStatus(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'success':
      case 'normal':
      case 'important':
        return 'success';
      case 'inactive':
      case 'pending':
      case 'sent':
        return 'secondary';
      case 'error':
      case 'failed':
      case 'archived':
        return 'destructive';
      case 'in_progress':
        return 'warning';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get color classes
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      teal: 'bg-teal-50 border-teal-200 text-teal-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      gray: 'bg-gray-50 border-gray-200 text-gray-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700'
    };
    return colorMap[color] || colorMap.blue;
  };

  // Utility functions for file generation and download
  const generateCSV = (data: any[], includeHeaders: boolean): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    let csv = '';
    
    if (includeHeaders) {
      csv += headers.join(',') + '\n';
    }
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csv += values.join(',') + '\n';
    });
    
    return csv;
  };

  const generateExcel = (data: any[], includeHeaders: boolean): string => {
    // For simplicity, we'll generate a CSV-like format that can be opened in Excel
    // In a real implementation, you'd use a library like xlsx or exceljs
    return generateCSV(data, includeHeaders);
  };

  const generatePDF = (data: any[], includeHeaders: boolean): string => {
    // For simplicity, we'll generate a text representation
    // In a real implementation, you'd use a library like jsPDF or pdfmake
    let pdfContent = '';
    
    if (includeHeaders && data.length > 0) {
      const headers = Object.keys(data[0]);
      pdfContent += headers.join(' | ') + '\n';
      pdfContent += '-'.repeat(headers.join(' | ').length) + '\n';
    }
    
    data.forEach(row => {
      const values = Object.values(row).map(value => value || '');
      pdfContent += values.join(' | ') + '\n';
    });
    
    return pdfContent;
  };

  const generateJSON = (data: any[]): string => {
    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col">
          {/* Visually hidden DialogTitle for accessibility */}
          <DialogTitle className="sr-only">
            Bulk Actions - {entityLabel}
          </DialogTitle>
          
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-start gap-4 pr-24">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {entityConfig.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">
                  Bulk Actions
                </h2>
                <p className="text-blue-100 text-sm">
                  Configure and execute actions on {selectedItems.length} selected {entityLabel}
                </p>
                

              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
            {/* Info: Action Configuration */}
            <div className="flex items-center gap-2 p-2 bg-blue-50/30 border border-blue-200 rounded text-blue-700 text-xs">
              <Info className="h-3 w-3 text-blue-600" />
              <span>Choose an action type and configure its settings</span>
            </div>

            {/* Tabbed Action Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full bg-white border-2 border-gray-200 rounded-xl p-1 h-10 shadow-sm">
                {finalAvailableActions.map((action) => (
                  <TabsTrigger 
                    key={action.tabId} 
                    value={action.tabId}
                    className="flex items-center gap-3 flex-1 h-full px-6 py-3 text-sm font-semibold text-blue-600 bg-transparent border-0 rounded transition-all duration-200 hover:text-blue-900 hover:bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Export Tab */}
              <TabsContent value="export" className="space-y-4 mt-4">
                <Card className="border-blue-200 bg-white">
                  <CardContent className="p-2">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-blue-900">Export Configuration</h3>
                            <p className="text-sm text-blue-600">Choose format and columns to export {editableSelectedItems.length} {entityLabel}</p>
                          </div>
                          <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                            {exportConfig.selectedColumns.length} columns selected
                          </Badge>
                        </div>
                        <Separator className="bg-blue-200" />
                      </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Format Selection */}
                    <div className="space-y-4">
                      <Label className="text-base font-bold">Export Format</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
                          <div
                            key={key}
                            className={`
                              p-4 border-2 rounded cursor-pointer transition-all duration-200
                              ${exportConfig.format === key 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                              }
                            `}
                            onClick={() => setExportConfig(prev => ({ ...prev, format: key }))}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                p-2 rounded ${exportConfig.format === key ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-600'}
                              `}>
                                {format.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-blue-900">{format.label}</div>
                                <div className="text-sm text-blue-600">{format.description}</div>
                              </div>
                              {exportConfig.format === key && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column Selection */}
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-bold text-blue-800">Select Columns</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAllColumns}
                              className="text-xs rounded border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleDeselectAllColumns}
                              className="text-xs rounded border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>

                        {/* Additional Options */}
                        <div className="flex items-center justify-end p-2 bg-gray-50 rounded border border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="include-headers"
                              checked={exportConfig.includeHeaders}
                              onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeHeaders: checked as boolean }))}
                            />
                            <Label htmlFor="include-headers" className="text-sm font-medium text-gray-700">
                              Include column headers
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                        {entityConfig.availableColumns?.map((column) => (
                          <div key={column.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`column-${column.key}`}
                              checked={exportConfig.selectedColumns.includes(column.key)}
                              onCheckedChange={() => handleColumnToggle(column.key)}
                            />
                            <Label
                              htmlFor={`column-${column.key}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {column.label}
                            </Label>
                          </div>
                        ))}
                      </div>

                      {/* File Name at bottom */}
                      <div className="space-y-2 mt-8">
                        <Label htmlFor="file-name" className="text-base font-bold">File Name</Label>
                        <Input
                          id="file-name"
                          value={exportConfig.fileName}
                          onChange={(e) => setExportConfig(prev => ({ ...prev, fileName: e.target.value }))}
                          placeholder={`${entityLabel}_export_${new Date().toISOString().split('T')[0]}`}
                        />
                      </div>
                    </div>
                  </div>

                  {exportConfig.selectedColumns.length === 0 && (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please select at least one column to export.</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleTabAction('export')}
                    disabled={exportConfig.selectedColumns.length === 0 || isProcessing}
                    className="w-full rounded"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export {editableSelectedItems.length} {entityLabel}
                  </Button>
                </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Status Update Tab */}
              <TabsContent value="status" className="space-y-8 mt-8">
                <Card className="border-blue-200 bg-white">
                  <CardContent className="p-2">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-blue-900">Update Status</h3>
                          <p className="text-sm text-blue-600">Change the status of {editableSelectedItems.length} selected {entityLabel}</p>
                        </div>
                        <Separator className="bg-blue-200" />
                      </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>New Status</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {STATUS_OPTIONS[entityType as keyof typeof STATUS_OPTIONS]?.map((status) => (
                          <div
                            key={status.value}
                            className={`
                              p-4 border-2 rounded cursor-pointer transition-all duration-200
                              ${statusConfig.newStatus === status.value 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                              }
                            `}
                            onClick={() => setStatusConfig(prev => ({ ...prev, newStatus: status.value }))}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                p-2 rounded ${statusConfig.newStatus === status.value ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-600'}
                              `}>
                                {status.icon}
                              </div>
                              <div className="font-medium text-blue-900">{status.label}</div>
                              {statusConfig.newStatus === status.value && (
                                <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status-reason">Reason (Optional)</Label>
                      <Input
                        id="status-reason"
                        value={statusConfig.reason}
                        onChange={(e) => setStatusConfig(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Enter reason for status change..."
                      />
                    </div>

                    <Button 
                      onClick={() => handleTabAction('status-update')}
                      disabled={isProcessing}
                      className="w-full rounded"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Update Status for {editableSelectedItems.length} {entityLabel}
                    </Button>
                  </div>
                </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhanced Notification Tab */}
              <TabsContent value="notification" className="space-y-6 mt-6">
                <Card className="border-blue-200 bg-white shadow-sm">
                  <CardContent className="p-2">
                    {/* Enhanced Header with Gradient */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
                        <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Bell className="w-7 h-7 text-white" />
                          </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-blue-900 mb-1">Send Notifications</h3>
                          <div className="flex items-center gap-4 text-sm text-blue-600">
                            <span className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {editableSelectedItems.length} {entityLabel}
                            </span>
                            <span className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Bulk notification
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-white/80 text-blue-700 border-blue-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Instant delivery
                          </Badge>
                        </div>
                      </div>
                      </div>

                    <div className="p-6 space-y-8">
                      {/* Enhanced Notification Form with Message Composition */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - 2/3 width */}
                        <div className="lg:col-span-2 space-y-6">
                          {/* Template Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-semibold text-blue-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Quick Templates
                              </Label>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Optional
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {NOTIFICATION_TEMPLATES[entityType as keyof typeof NOTIFICATION_TEMPLATES]?.map((template) => (
                                <div
                                  key={template.id}
                                  className={`
                                    p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                                    ${notificationConfig.template === template.id 
                                      ? 'border-blue-300 bg-blue-50 shadow-md' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                    }
                                  `}
                                  onClick={() => {
                                    setNotificationConfig(prev => ({
                                      ...prev,
                                      template: template.id,
                                      subject: template.subject,
                                      message: template.message,
                                      priority: template.priority
                                    }));
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`
                                      p-1.5 rounded ${notificationConfig.template === template.id ? 'bg-blue-100' : 'bg-gray-100'}
                                    `}>
                                      <FileText className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-blue-900 truncate">{template.name}</div>
                                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{template.subject}</div>
                                    </div>
                                    {notificationConfig.template === template.id && (
                                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              )) || NOTIFICATION_TEMPLATES.general.map((template) => (
                                <div
                                  key={template.id}
                                  className={`
                                    p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                                    ${notificationConfig.template === template.id 
                                      ? 'border-blue-300 bg-blue-50 shadow-md' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                    }
                                  `}
                                  onClick={() => {
                                    setNotificationConfig(prev => ({
                                      ...prev,
                                      template: template.id,
                                      subject: template.subject,
                                      message: template.message,
                                      priority: template.priority
                                    }));
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`
                                      p-1.5 rounded ${notificationConfig.template === template.id ? 'bg-blue-100' : 'bg-gray-100'}
                                    `}>
                                      <FileText className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-blue-900 truncate">{template.name}</div>
                                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">{template.subject}</div>
                                    </div>
                                    {notificationConfig.template === template.id && (
                                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Info className="w-4 h-4 text-blue-500" />
                                <span>Select a template to quickly populate your notification, or start from scratch</span>
                              </div>
                              {notificationConfig.template && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setNotificationConfig(prev => ({ ...prev, template: '' }))}
                                  className="text-xs h-7 px-2"
                                >
                                  Clear Template
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Subject Field with Enhanced Styling */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notification-subject" className="text-base font-semibold text-blue-900 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                            Subject Line
                          </Label>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Required
                              </Badge>
                            </div>
                                                         <div className="relative group">
                            <Input
                              id="notification-subject"
                              value={notificationConfig.subject}
                              onChange={(e) => setNotificationConfig(prev => ({ ...prev, subject: e.target.value }))}
                                 placeholder="Enter a compelling subject line that grabs attention..."
                                 className={`pl-12 pr-4 py-4 text-base border-2 rounded-xl transition-all duration-300 group-hover:border-blue-300 focus:ring-4 focus:ring-blue-500/10 ${
                                   notificationConfig.subject.length > 60 
                                     ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
                                     : notificationConfig.subject.length > 50 
                                     ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/10'
                                     : 'border-gray-200 focus:border-blue-500'
                                 }`}
                               />
                               <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                               <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                 <Badge variant="outline" className={`text-xs ${
                                   notificationConfig.subject.length > 60 
                                     ? 'bg-red-50 text-red-700 border-red-200' 
                                     : notificationConfig.subject.length > 50 
                                     ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                     : 'bg-green-50 text-green-700 border-green-200'
                                 }`}>
                                   {notificationConfig.subject.length}/60
                                 </Badge>
                          </div>
                             </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Info className="w-4 h-4 text-blue-500" />
                              <span>Keep it under 60 characters for better mobile display</span>
                            </div>
                        </div>

                          {/* Enhanced Message Field */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notification-message" className="text-base font-semibold text-blue-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                            Message Content
                          </Label>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  Required
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${notificationConfig.message.length > 400 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                  {notificationConfig.message.length}/500
                                </Badge>
                              </div>
                            </div>
                                                         <div className="relative group">
                            <textarea
                              id="notification-message"
                              value={notificationConfig.message}
                              onChange={(e) => setNotificationConfig(prev => ({ ...prev, message: e.target.value }))}
                                 placeholder="Write your notification message here. Be clear, concise, and actionable..."
                                 className={`w-full min-h-[160px] p-5 pl-12 text-base border-2 rounded-xl resize-none focus:outline-none focus:ring-4 transition-all duration-300 group-hover:border-blue-300 leading-relaxed ${
                                   notificationConfig.message.length > 500 
                                     ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
                                     : notificationConfig.message.length > 400 
                                     ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/10'
                                     : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'
                                 }`}
                               />
                               <FileText className="absolute left-4 top-5 w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                          </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Info className="w-4 h-4 text-blue-500" />
                              <span>Include a clear call-to-action and relevant details</span>
                            </div>
                          </div>
                        </div>

                        {/* Settings Panel - 1/3 width */}
                        <div className="space-y-6">
                          {/* Priority Selection */}
                          <div className="space-y-4">
                            <Label className="text-base font-semibold text-blue-900 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-blue-600" />
                              Priority Level
                            </Label>
                          <div className="space-y-3">
                              {[
                                { 
                                  value: 'low', 
                                  label: 'Low Priority', 
                                  description: 'Informational updates',
                                  color: 'from-green-50 to-emerald-50 border-green-200 text-green-700',
                                  icon: <Clock className="w-4 h-4" />,
                                  bgColor: 'bg-green-100'
                                },
                                { 
                                  value: 'medium', 
                                  label: 'Medium Priority', 
                                  description: 'Important notices',
                                  color: 'from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700',
                                  icon: <AlertTriangle className="w-4 h-4" />,
                                  bgColor: 'bg-yellow-100'
                                },
                                { 
                                  value: 'high', 
                                  label: 'High Priority', 
                                  description: 'Urgent alerts',
                                  color: 'from-red-50 to-pink-50 border-red-200 text-red-700',
                                  icon: <AlertTriangle className="w-4 h-4" />,
                                  bgColor: 'bg-red-100'
                                }
                              ].map((priority) => (
                                <div
                                  key={priority.value}
                                  className={`
                                    p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group hover:shadow-md
                                    ${notificationConfig.priority === priority.value 
                                      ? `bg-gradient-to-r ${priority.color} shadow-lg scale-[1.02]` 
                                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                    }
                                  `}
                                  onClick={() => setNotificationConfig(prev => ({ ...prev, priority: priority.value as 'low' | 'medium' | 'high' }))}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`
                                      p-2 rounded-lg ${notificationConfig.priority === priority.value ? priority.bgColor : 'bg-gray-100'}
                                      group-hover:scale-110 transition-transform duration-200
                                    `}>
                                    {priority.icon}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-sm">{priority.label}</div>
                                      <div className="text-xs opacity-75">{priority.description}</div>
                                    </div>
                                    {notificationConfig.priority === priority.value && (
                                      <CheckCircle className="w-5 h-5 text-green-600 animate-pulse" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Additional Options */}
                          <div className="space-y-4">
                            <Label className="text-base font-semibold text-blue-900 flex items-center gap-2">
                              <Settings className="w-4 h-4 text-blue-600" />
                              Additional Options
                            </Label>
                          <div className="space-y-3">
                              <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <Checkbox
                                  id="include-attachments"
                                  checked={notificationConfig.includeAttachments}
                                  onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, includeAttachments: checked as boolean }))}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <Label htmlFor="include-attachments" className="text-sm font-semibold text-blue-900 cursor-pointer">
                                    Include attachments
                                  </Label>
                                  <p className="text-xs text-gray-600 mt-1">Attach relevant files, documents, or images</p>
                                </div>
                              </div>
                            </div>
                          </div>

                                      {/* Quick Stats */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Notification Stats
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{editableSelectedItems.length}</div>
                  <div className="text-xs text-blue-600">Recipients</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {notificationConfig.subject && notificationConfig.message ? 'Ready' : 'Draft'}
                  </div>
                  <div className="text-xs text-green-600">Status</div>
                </div>
              </div>
              
              {/* Progress Indicator */}
              {isProcessing && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Sending notifications...</span>
                  </div>
                  <Progress 
                    value={
                      Object.values(actionProgress).reduce((sum, p) => sum + p.progress, 0) / editableSelectedItems.length
                    } 
                    className="w-full h-2" 
                  />
                  <div className="text-xs text-blue-600 mt-1">
                    {Object.values(actionProgress).filter(p => p.status === 'completed').length} of {editableSelectedItems.length} completed
                  </div>
                </div>
              )}
            </div>
                          </div>
                        </div>

                      {/* Enhanced Preview Section */}
                        {notificationConfig.subject && notificationConfig.message && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold text-blue-900 flex items-center gap-2">
                              <Eye className="w-4 h-4 text-blue-600" />
                              Message Preview
                            </Label>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Live Preview
                            </Badge>
                          </div>
                          <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-inner">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                  <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        notificationConfig.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                        notificationConfig.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-green-50 text-green-700 border-green-200'
                                      }`}
                                    >
                                    {notificationConfig.priority} priority
                                  </Badge>
                                    <span className="text-xs text-gray-500">• Just now</span>
                                </div>
                                  <div className="font-bold text-lg text-blue-900">{notificationConfig.subject}</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-100">
                                {notificationConfig.message}
                              </div>
                              {notificationConfig.includeAttachments && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <FileText className="w-3 h-3" />
                                  <span>Attachments will be included</span>
                                </div>
                              )}
                              </div>
                            </div>
                          </div>
                        )}

                                             {/* Validation Summary */}
                       <div className="space-y-3">
                         <div className="flex items-center justify-between">
                           <Label className="text-base font-semibold text-blue-900 flex items-center gap-2">
                             <CheckCircle className="w-4 h-4 text-blue-600" />
                             Validation Summary
                           </Label>
                           <Badge variant="outline" className={`text-xs ${
                             (!notificationConfig.subject || !notificationConfig.message || 
                              notificationConfig.subject.length > 60 || notificationConfig.message.length > 500)
                               ? 'bg-red-50 text-red-700 border-red-200'
                               : 'bg-green-50 text-green-700 border-green-200'
                           }`}>
                             {(!notificationConfig.subject || !notificationConfig.message || 
                               notificationConfig.subject.length > 60 || notificationConfig.message.length > 500)
                               ? 'Issues Found' : 'Ready to Send'}
                           </Badge>
                         </div>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className={`p-3 rounded-lg border-2 ${
                             !notificationConfig.subject 
                               ? 'bg-red-50 border-red-200' 
                               : notificationConfig.subject.length > 60 
                               ? 'bg-yellow-50 border-yellow-200'
                               : 'bg-green-50 border-green-200'
                           }`}>
                             <div className="flex items-center gap-2">
                               {!notificationConfig.subject ? (
                                 <X className="w-4 h-4 text-red-600" />
                               ) : notificationConfig.subject.length > 60 ? (
                                 <AlertTriangle className="w-4 h-4 text-yellow-600" />
                               ) : (
                                 <CheckCircle className="w-4 h-4 text-green-600" />
                               )}
                               <span className="text-sm font-medium">Subject Line</span>
                             </div>
                             <div className="text-xs mt-1">
                               {!notificationConfig.subject 
                                 ? 'Subject is required' 
                                 : notificationConfig.subject.length > 60 
                                 ? 'Subject is too long (max 60 characters)'
                                 : 'Subject looks good'
                               }
                             </div>
                           </div>
                           
                           <div className={`p-3 rounded-lg border-2 ${
                             !notificationConfig.message 
                               ? 'bg-red-50 border-red-200' 
                               : notificationConfig.message.length > 500 
                               ? 'bg-yellow-50 border-yellow-200'
                               : 'bg-green-50 border-green-200'
                           }`}>
                             <div className="flex items-center gap-2">
                               {!notificationConfig.message ? (
                                 <X className="w-4 h-4 text-red-600" />
                               ) : notificationConfig.message.length > 500 ? (
                                 <AlertTriangle className="w-4 h-4 text-yellow-600" />
                               ) : (
                                 <CheckCircle className="w-4 h-4 text-green-600" />
                               )}
                               <span className="text-sm font-medium">Message Content</span>
                             </div>
                             <div className="text-xs mt-1">
                               {!notificationConfig.message 
                                 ? 'Message is required' 
                                 : notificationConfig.message.length > 500 
                                 ? 'Message is too long (max 500 characters)'
                                 : 'Message looks good'
                               }
                             </div>
                           </div>
                         </div>
                       </div>

                       {/* Enhanced Send Button */}
                       <div className="pt-4 border-t border-gray-200">
                                                <Button 
                          onClick={() => handleTabAction('notification')}
                          disabled={isProcessing || !notificationConfig.subject || !notificationConfig.message || 
                                   notificationConfig.subject.length > 60 || notificationConfig.message.length > 500}
                          className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          aria-label={`Send notification to ${editableSelectedItems.length} selected ${entityLabel}`}
                        >
                          <div className="flex items-center gap-3">
                            <Bell className="w-6 h-6" />
                            <span>Send Notification</span>
                            {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                          </div>
                        </Button>
                         <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                           <Shield className="w-3 h-3" />
                           <span>All notifications are logged for audit purposes</span>
                         </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Other Action Tabs */}
              {finalAvailableActions.filter(action => !['export', 'status', 'notification'].includes(action.tabId)).map((action) => (
                <TabsContent key={action.tabId} value={action.tabId} className="space-y-8 mt-8">
                  <Card className="border-blue-200 bg-white">
                    <CardContent className="p-2">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-blue-900">{action.label}</h3>
                            <p className="text-sm text-blue-600">{action.description}</p>
                          </div>
                          <Separator className="bg-blue-200" />
                        </div>

                    <div className="p-6 border-2 border-dashed border-gray-300 rounded text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {action.icon}
                        <span className="font-medium">Ready to execute</span>
                      </div>
                      <p className="text-sm text-blue-600 mb-4">
                        This action will be performed on {editableSelectedItems.length} selected {entityLabel}
                      </p>
                      <Button 
                        onClick={() => handleTabAction(action.id)}
                        disabled={isProcessing}
                        variant={action.id === 'delete' ? 'destructive' : 'default'}
                        className="rounded"
                      >
                        {action.id === 'delete' ? <Trash2 className="w-4 h-4 mr-2" /> : action.icon}
                        Execute {action.label}
                      </Button>
                    </div>
                  </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Progress Section */}
            {isProcessing && (
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Processing {editableSelectedItems.length} {entityLabel}</h3>
                      <p className="text-xs text-blue-600">Action in progress...</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Object.values(actionProgress).filter(p => p.status === 'completed').length}/{editableSelectedItems.length} Complete
                  </Badge>
                </div>
                
                {/* Overall Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">Overall Progress</span>
                    <span className="font-semibold text-blue-900">
                      {Math.round(
                        Object.values(actionProgress).reduce((sum, p) => sum + p.progress, 0) / editableSelectedItems.length
                      )}%
                    </span>
                  </div>
                  <Progress 
                    value={
                      Object.values(actionProgress).reduce((sum, p) => sum + p.progress, 0) / editableSelectedItems.length
                    } 
                    className="w-full h-2" 
                  />
                </div>
                

              </div>
            )}

            {/* Selected Items Summary - Expandable and Editable */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-blue-900">Selected {entityLabel}</h3>
                  <p className="text-sm text-blue-600">
                    {isPreviewEditing ? 'Edit selection' : 'Preview of items that will be affected'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {editableSelectedItems.length} selected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewEditing(!isPreviewEditing)}
                    className="text-xs rounded"
                  >
                    {isPreviewEditing ? <Eye className="w-3 h-3 mr-1" /> : <Edit3 className="w-3 h-3 mr-1" />}
                    {isPreviewEditing ? 'Preview' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                    className="text-xs rounded"
                  >
                    {isPreviewExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {isPreviewExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
              
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entityConfig.icon}
                      <span className="text-sm font-medium text-blue-700">
                        {entityLabel} {isPreviewEditing ? 'Selection Editor' : 'Preview'}
                      </span>
                    </div>
                    {isPreviewEditing && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllItems}
                          className="text-xs rounded"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeselectAllItems}
                          className="text-xs rounded"
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isPreviewEditing && (
                  <div className="p-3 border-b border-gray-200 bg-gray-50/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                )}
                
                <div className={`${isPreviewExpanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 sticky top-0">
                        {isPreviewEditing && (
                          <TableHead className="w-12 text-center">
                            <Checkbox
                              checked={editableSelectedItems.length === selectedItems.length && selectedItems.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleSelectAllItems();
                                } else {
                                  handleDeselectAllItems();
                                }
                              }}
                            />
                          </TableHead>
                        )}
                        {entityConfig.tableColumns.map((column) => (
                          <TableHead key={column.key} className="text-xs font-medium text-blue-700">
                            {column.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(isPreviewEditing ? filteredItems : selectedItems.slice(0, isPreviewExpanded ? undefined : 5)).map((item, index) => {
                        const isSelected = editableSelectedItems.some(selectedItem => getItemId(selectedItem) === getItemId(item));
                        return (
                          <TableRow 
                            key={getItemId(item)} 
                            className={`hover:bg-gray-50/50 ${isPreviewEditing ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50/50' : ''}`}
                            onClick={isPreviewEditing ? () => handleItemToggle(item) : undefined}
                          >
                            {isPreviewEditing && (
                              <TableCell className="w-12 text-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleItemToggle(item)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </TableCell>
                            )}
                            {entityConfig.tableColumns.map((column) => (
                              <TableCell key={column.key} className="text-xs py-3">
                                {column.key === 'status' ? (
                                  <Badge variant={getStatusBadgeVariant(getItemStatus(item))} className="text-xs">
                                    {getItemStatus(item)}
                                  </Badge>
                                ) : (
                                  <span className="text-blue-900">
                                    {(() => {
                                      const value = (item as any)[column.key];
                                      // Handle nested objects like department
                                      if (column.key === 'department' && value && typeof value === 'object') {
                                        return value.departmentName || value.name || 'Unknown Department';
                                      }
                                      // Handle other nested objects
                                      if (value && typeof value === 'object') {
                                        return JSON.stringify(value);
                                      }
                                      return value || getItemDisplayName(item);
                                    })()}
                                  </span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}

                      {isPreviewEditing && filteredItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={entityConfig.tableColumns.length + 1} className="text-xs text-blue-500 text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-6 h-6 text-blue-400" />
                              <span>No items found matching your search</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-6 border-t border-gray-200 bg-gray-50/50 px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 text-sm text-blue-600">
                <div className="p-1.5 rounded bg-blue-100">
                  <Info className="w-4 h-4 text-blue-500" />
                </div>
                <span className="font-medium">All actions are logged for audit purposes</span>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={onCancel} 
                  disabled={isProcessing}
                  className="px-6 py-2 font-medium rounded"
                >
                  {isProcessing ? 'Processing...' : 'Close'}
                </Button>
              </div>
            </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Confirm Action
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-blue-600">{confirmationMessage}</p>
            
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  This action will be performed on {editableSelectedItems.length} selected {entityLabel}.
                  Please ensure you have the necessary permissions.
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="rounded">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              className="bg-orange-600 hover:bg-orange-700 rounded"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Confirmation Dialog */}
      <Dialog open={showNotificationConfirmation} onOpenChange={setShowNotificationConfirmation}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Confirm sending notification to {editableSelectedItems.length} {entityLabel}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Simple Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      notificationConfig.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                      notificationConfig.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {notificationConfig.priority} priority
                  </Badge>
                </div>
                <div className="font-medium text-blue-900">{notificationConfig.subject}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{notificationConfig.message}</div>
              </div>
            </div>

            {/* Recipients */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  {editableSelectedItems.length} {entityLabel} selected
                </div>
                <div className="text-sm text-blue-600">
                  {editableSelectedItems.slice(0, 3).map(item => getItemDisplayName(item)).join(', ')}
                  {editableSelectedItems.length > 3 && ` and ${editableSelectedItems.length - 3} more`}
                </div>
              </div>
            </div>

            {/* Simple Warning */}
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                This action cannot be undone. All selected {entityLabel} will receive this notification immediately.
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationConfirmation(false)} className="rounded">
              Cancel
            </Button>
            <Button
              onClick={handleNotificationConfirm}
              className="bg-blue-600 hover:bg-blue-700 rounded"
              aria-label="Send notification to selected recipients"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Results Dialog */}
      <Dialog open={!!notificationResults} onOpenChange={() => setNotificationResults(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notificationResults?.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              Notification Results
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              notificationResults?.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {notificationResults?.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {notificationResults?.processed} {entityLabel} notified successfully
                  </div>
                  {notificationResults?.failed && notificationResults.failed > 0 && (
                    <div className="text-sm text-red-600">
                      {notificationResults.failed} {entityLabel} failed to receive notification
                    </div>
                  )}
                </div>
              </div>
            </div>

            {notificationResults?.errors && notificationResults.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-red-900">Failed Notifications</h4>
                <div className="max-h-32 overflow-y-auto border border-red-200 rounded p-3 bg-red-50/50">
                  <div className="space-y-2">
                    {notificationResults.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {error}
                      </div>
                    ))}
                    {notificationResults.errors.length > 5 && (
                      <div className="text-xs text-red-600 italic">
                        ... and {notificationResults.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setNotificationResults(null)}
              className="rounded"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BulkActionsDialog;
export { BulkActionsDialog }; 