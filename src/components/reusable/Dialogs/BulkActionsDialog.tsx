"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  User
} from "lucide-react";
import { backupService, type BackupItem } from "@/lib/services/backup.service";

interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBackups: BackupItem[];
  onSuccess?: () => void;
  canPerformActions?: boolean;
}

interface BulkAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'warning';
  action: () => Promise<void>;
  disabled?: boolean;
  confirmation?: string;
}

interface ActionProgress {
  [backupId: string]: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
  message: string;
    error?: string;
  };
}

export default function BulkActionsDialog({ 
  open, 
  onOpenChange, 
  selectedBackups,
  onSuccess,
  canPerformActions = true
}: BulkActionsDialogProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionProgress, setActionProgress] = useState<ActionProgress>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // Initialize progress for selected backups
  useEffect(() => {
    if (selectedBackups.length > 0) {
      const initialProgress: ActionProgress = {};
      selectedBackups.forEach(backup => {
        initialProgress[backup.id] = {
          status: 'pending',
          progress: 0,
          message: 'Waiting to start...'
        };
      });
      setActionProgress(initialProgress);
    }
  }, [selectedBackups]);

  // Available bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'download',
      label: 'Download Selected',
      description: 'Download all selected completed backups',
      icon: <Download className="w-5 h-5" />,
      variant: 'default',
      action: handleBulkDownload,
      disabled: !selectedBackups.some(b => b.status === 'COMPLETED'),
      confirmation: `Download ${selectedBackups.filter(b => b.status === 'COMPLETED').length} backup(s)?`
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      description: 'Permanently delete selected backups',
      icon: <Trash2 className="w-5 h-5" />,
      variant: 'destructive',
      action: handleBulkDelete,
      disabled: !selectedBackups.some(b => b.status !== 'COMPLETED' && b.status !== 'IN_PROGRESS'),
      confirmation: `Permanently delete ${selectedBackups.filter(b => b.status !== 'COMPLETED' && b.status !== 'IN_PROGRESS').length} backup(s)? This action cannot be undone.`
    },
    {
      id: 'refresh',
      label: 'Refresh Status',
      description: 'Update status of selected backups',
      icon: <RefreshCw className="w-5 h-5" />,
      variant: 'default',
      action: handleBulkRefresh,
      confirmation: `Refresh status of ${selectedBackups.length} backup(s)?`
    },
    {
      id: 'export',
      label: 'Export Details',
      description: 'Export backup details to CSV',
      icon: <FileText className="w-5 h-5" />,
      variant: 'default',
      action: handleBulkExport,
      confirmation: `Export details of ${selectedBackups.length} backup(s)?`
    }
  ];

  // Handle bulk download
  async function handleBulkDownload() {
    const completedBackups = selectedBackups.filter(b => b.status === 'COMPLETED');
    if (completedBackups.length === 0) {
      toast.error('No completed backups selected for download');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const backup of completedBackups) {
      setActionProgress(prev => ({
        ...prev,
        [backup.id]: {
          status: 'in_progress',
          progress: 0,
          message: 'Preparing download...'
        }
      }));

      try {
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 20) {
          setActionProgress(prev => ({
            ...prev,
            [backup.id]: {
              status: 'in_progress',
              progress: i,
              message: `Downloading ${backup.name}...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const success = await backupService.downloadBackup(backup.id);
        
        if (success) {
          setActionProgress(prev => ({
            ...prev,
            [backup.id]: {
              status: 'completed',
              progress: 100,
              message: 'Download completed'
            }
          }));
          successCount++;
        } else {
          setActionProgress(prev => ({
            ...prev,
            [backup.id]: {
              status: 'failed',
              progress: 0,
              message: 'Download failed',
              error: 'Failed to download backup'
            }
          }));
          failCount++;
        }
      } catch (error) {
        setActionProgress(prev => ({
        ...prev,
          [backup.id]: {
            status: 'failed',
            progress: 0,
            message: 'Download failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
        failCount++;
      }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully downloaded ${successCount} backup(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to download ${failCount} backup(s)`);
    }

    onSuccess?.();
  }

  // Handle bulk delete
  async function handleBulkDelete() {
    const deletableBackups = selectedBackups.filter(b => b.status !== 'COMPLETED' && b.status !== 'IN_PROGRESS');
    if (deletableBackups.length === 0) {
      toast.error('No eligible backups selected for deletion');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const backup of deletableBackups) {
      setActionProgress(prev => ({
        ...prev,
        [backup.id]: {
          status: 'in_progress',
          progress: 0,
          message: 'Deleting backup...'
        }
      }));

      try {
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 25) {
          setActionProgress(prev => ({
            ...prev,
            [backup.id]: {
              status: 'in_progress',
              progress: i,
              message: `Deleting ${backup.name}...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        const success = await backupService.deleteBackup(backup.id);
        
        if (success) {
          setActionProgress(prev => ({
        ...prev,
            [backup.id]: {
              status: 'completed',
              progress: 100,
              message: 'Delete completed'
            }
          }));
          successCount++;
    } else {
          setActionProgress(prev => ({
        ...prev,
            [backup.id]: {
              status: 'failed',
              progress: 0,
              message: 'Delete failed',
              error: 'Failed to delete backup'
            }
          }));
          failCount++;
        }
      } catch (error) {
        setActionProgress(prev => ({
          ...prev,
          [backup.id]: {
            status: 'failed',
            progress: 0,
            message: 'Delete failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
        failCount++;
      }
    }

          setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} backup(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} backup(s)`);
    }

    onSuccess?.();
  }

  // Handle bulk refresh
  async function handleBulkRefresh() {
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const backup of selectedBackups) {
      setActionProgress(prev => ({
        ...prev,
        [backup.id]: {
          status: 'in_progress',
          progress: 0,
          message: 'Refreshing status...'
        }
      }));

      try {
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 33) {
          setActionProgress(prev => ({
            ...prev,
            [backup.id]: {
              status: 'in_progress',
              progress: i,
              message: `Refreshing ${backup.name}...`
            }
          }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setActionProgress(prev => ({
          ...prev,
          [backup.id]: {
            status: 'completed',
            progress: 100,
            message: 'Status refreshed'
          }
        }));
        successCount++;
      } catch (error) {
        setActionProgress(prev => ({
          ...prev,
          [backup.id]: {
            status: 'failed',
            progress: 0,
            message: 'Refresh failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
        failCount++;
      }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully refreshed ${successCount} backup(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to refresh ${failCount} backup(s)`);
    }

    onSuccess?.();
  }

  // Handle bulk export
  async function handleBulkExport() {
    setIsProcessing(true);

    try {
      // Generate CSV content
      const headers = ['ID', 'Name', 'Type', 'Size', 'Status', 'Location', 'Created By', 'Created At'];
      const rows = selectedBackups.map(backup => [
        backup.id,
        backup.name,
        backup.type,
        backup.size,
        backup.status,
        backup.location,
        backup.createdBy,
        new Date(backup.createdAt).toLocaleString()
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-details-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported details of ${selectedBackups.length} backup(s)`);
    } catch (error) {
      console.error('Error exporting backup details:', error);
      toast.error('Failed to export backup details');
    }

    setIsProcessing(false);
    onSuccess?.();
  }

  // Handle action selection
  const handleActionSelect = (actionId: string) => {
    const action = bulkActions.find(a => a.id === actionId);
    if (!action) return;

    setSelectedAction(actionId);
    setConfirmationMessage(action.confirmation || '');
    setShowConfirmation(true);
  };

  // Handle confirmation
  const handleConfirmAction = async () => {
    const action = bulkActions.find(a => a.id === selectedAction);
    if (!action) return;

    setShowConfirmation(false);
    setSelectedAction(null);
    
    try {
      await action.action();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'in_progress':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Bulk Actions
              <Badge variant="secondary">{selectedBackups.length} selected</Badge>
                  </DialogTitle>
            <DialogDescription>
              Perform actions on multiple backups simultaneously
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Action Selection */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Available Actions</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bulkActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => handleActionSelect(action.id)}
                    disabled={action.disabled || isProcessing || !canPerformActions}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {action.icon}
                      <span className="font-medium">{action.label}</span>
                        </div>
                    <span className="text-xs opacity-80 text-left">{action.description}</span>
                  </Button>
                      ))}
                        </div>
                    </div>

            {/* Progress Section */}
            {isProcessing && (
              <div className="space-y-4">
                <div className="text-sm font-medium">Action Progress</div>
                <div className="space-y-3">
                  {Object.entries(actionProgress).map(([backupId, progress]) => {
                    const backup = selectedBackups.find(b => b.id === backupId);
                    if (!backup) return null;

                    return (
                      <div key={backupId} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(progress.status)}
                            <span className="font-medium">{backup.name}</span>
                            <Badge variant={getStatusBadgeVariant(progress.status)}>
                              {progress.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">{progress.progress}%</span>
                        </div>
                        <Progress value={progress.progress} className="w-full" />
                        <div className="text-sm text-gray-600">{progress.message}</div>
                        {progress.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {progress.error}
                        </div>
                      )}
                    </div>
                    );
                  })}
                          </div>
                          </div>
            )}

            {/* Selected Backups Summary */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Selected Backups</div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBackups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="font-medium">{backup.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{backup.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            backup.status === 'COMPLETED' ? 'success' :
                            backup.status === 'IN_PROGRESS' ? 'warning' :
                            backup.status === 'FAILED' ? 'destructive' : 'secondary'
                          }>
                            {backup.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{backup.size}</TableCell>
                        <TableCell>
                          {new Date(backup.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                          </div>
                        </div>
                        </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Close
            </Button>
          </DialogFooter>
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
            <p className="text-gray-600">{confirmationMessage}</p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  This action will be performed on {selectedBackups.length} selected backup(s).
                  Please ensure you have the necessary permissions.
                </div>
              </div>
            </div>
          </div>
          
            <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Cancel
              </Button>
              <Button
              onClick={handleConfirmAction}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
} 